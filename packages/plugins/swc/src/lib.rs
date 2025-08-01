use std::collections::HashMap;
use std::path::{Path, PathBuf};
use swc_core::ecma::{
    ast::*,
    visit::{as_folder, FoldWith, VisitMut, VisitMutWith},
};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};
use serde::{Deserialize, Serialize};

const PACKAGE_NAME: &str = "react-loosely-lazy";
const MODULE_ID_KEY: &str = "moduleId";

const DEFAULT_SSR_SETTINGS: &[(&str, bool)] = &[
    ("lazyForPaint", true),
    ("lazyAfterPaint", true),
    ("lazy", false),
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModulePathReplacer {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginOptions {
    #[serde(default)]
    pub client: bool,
    #[serde(rename = "modulePathReplacer")]
    pub module_path_replacer: Option<ModulePathReplacer>,
    #[serde(default = "default_noop_redundant_loaders")]
    #[serde(rename = "noopRedundantLoaders")]
    pub noop_redundant_loaders: bool,
    pub root: Option<String>,
}

fn default_noop_redundant_loaders() -> bool {
    true
}

impl Default for PluginOptions {
    fn default() -> Self {
        Self {
            client: false,
            module_path_replacer: None,
            noop_redundant_loaders: true,
            root: None,
        }
    }
}

pub struct TransformVisitor {
    options: PluginOptions,
    filename: Option<String>,
    lazy_imports: HashMap<String, String>,
    current_working_dir: PathBuf,
}

impl TransformVisitor {
    pub fn new(options: PluginOptions, filename: Option<String>) -> Self {
        Self {
            options,
            filename,
            lazy_imports: HashMap::new(),
            current_working_dir: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        }
    }

    fn is_lazy_method_call(&self, ident: &Ident) -> Option<&String> {
        self.lazy_imports.get(&ident.sym.to_string())
    }

    fn get_default_ssr(&self, method_name: &str) -> bool {
        DEFAULT_SSR_SETTINGS
            .iter()
            .find(|(name, _)| *name == method_name)
            .map(|(_, ssr)| *ssr)
            .unwrap_or(false)
    }

    fn extract_import_from_expr(&self, expr: &Expr) -> Option<String> {
        match expr {
            Expr::Call(call_expr) => {
                if let Callee::Import(_) = &call_expr.callee {
                    if let Some(ExprOrSpread { expr: arg, .. }) = call_expr.args.first() {
                        if let Expr::Lit(Lit::Str(str_lit)) = &**arg {
                            return Some(str_lit.value.to_string());
                        }
                    }
                } else {
                    // Check if this is a .then() call on an import()
                    if let Callee::Expr(callee_expr) = &call_expr.callee {
                        if let Expr::Member(member_expr) = &**callee_expr {
                            if let MemberProp::Ident(prop) = &member_expr.prop {
                                if prop.sym == "then" {
                                    // This is a .then() call, check the object for import()
                                    return self.extract_import_from_expr(&member_expr.obj);
                                }
                            }
                        }
                    }
                }
            }
            Expr::Member(member_expr) => {
                // Handle cases like import().then()
                return self.extract_import_from_expr(&member_expr.obj);
            }
            _ => {}
        }
        None
    }

    fn resolve_import_path(&self, import_path: &str) -> Option<PathBuf> {
        let current_file = self.filename.as_ref()?;
        let current_dir = Path::new(current_file).parent().unwrap_or(Path::new("."));

        // Handle npm packages (non-relative imports)
        if !import_path.starts_with('.') && !import_path.starts_with('/') {
            // Simple node_modules resolution - look for node_modules in current and parent dirs
            let mut check_dir = current_dir;
            loop {
                let node_modules = check_dir.join("node_modules").join(import_path);

                // Try different extensions
                for ext in &["/index.js", "/index.jsx", "/index.ts", "/index.tsx", ".js", ".jsx", ".ts", ".tsx"] {
                    let _with_ext = node_modules.with_extension("").join(format!("{}{}", node_modules.file_name()?.to_string_lossy(), ext));
                    if ext.starts_with('/') {
                        let index_path = node_modules.join(&ext[1..]);
                        if index_path.exists() {
                            return Some(index_path);
                        }
                    } else {
                        let file_path = node_modules.with_extension(&ext[1..]);
                        if file_path.exists() {
                            return Some(file_path);
                        }
                    }
                }

                // Try package.json main field (simplified)
                let pkg_json = node_modules.join("package.json");
                if pkg_json.exists() {
                    // For simplicity, just return index.js in the package directory
                    let index_js = node_modules.join("index.js");
                    if index_js.exists() {
                        return Some(index_js);
                    }
                }

                if let Some(parent) = check_dir.parent() {
                    check_dir = parent;
                } else {
                    break;
                }
            }

            // Fallback: assume it exists at ./node_modules/package/index.js
            return Some(Path::new("./node_modules").join(import_path).join("index.js"));
        }

        // Handle relative imports
        let resolved = current_dir.join(import_path);

        // Try different extensions
        for ext in &["", ".js", ".jsx", ".ts", ".tsx"] {
            let with_ext = if ext.is_empty() {
                resolved.clone()
            } else {
                resolved.with_extension(&ext[1..])
            };

            if with_ext.exists() {
                return Some(with_ext);
            }
        }

        // Try index files
        for ext in &["index.js", "index.jsx", "index.ts", "index.tsx"] {
            let index_path = resolved.join(ext);
            if index_path.exists() {
                return Some(index_path);
            }
        }

        // Default: try to infer extension from import name
        if import_path.contains("ts-component") {
            Some(resolved.with_extension("ts"))
        } else if import_path.contains("tsx-component") {
            Some(resolved.with_extension("tsx"))
        } else {
            Some(resolved.with_extension("js"))
        }
    }

    fn generate_module_id(&self, import_path: &str) -> String {
        let default_filename = "index.js".to_string();
        let current_file = self.filename.as_ref().unwrap_or(&default_filename);

        if let Some(resolved_path) = self.resolve_import_path(import_path) {
            // Get relative path from current working directory
            let relative_to_cwd = if let Some(rel) = pathdiff::diff_paths(&resolved_path, &self.current_working_dir) {
                rel
            } else {
                resolved_path
            };

            let mut path_str = relative_to_cwd.to_string_lossy().to_string();

            // Ensure relative path format first
            if !path_str.starts_with("./") && !path_str.starts_with("../") {
                path_str = format!("./{}", path_str);
            }

            // Apply module path replacer if provided (after ensuring relative format)
            if let Some(replacer) = &self.options.module_path_replacer {
                path_str = path_str.replace(&replacer.from, &replacer.to);
            }

            // Normalize path separators to forward slashes
            path_str = path_str.replace('\\', "/");

            path_str
        } else {
            // Fallback logic for when we can't resolve the file
            let current_dir = Path::new(current_file).parent().unwrap_or(Path::new("."));

            let resolved = if import_path.starts_with('.') || import_path.starts_with('/') {
                current_dir.join(import_path).with_extension("js")
            } else {
                Path::new("./node_modules").join(import_path).join("index.js")
            };

            let relative_to_cwd = if let Some(rel) = pathdiff::diff_paths(&resolved, &self.current_working_dir) {
                rel
            } else {
                resolved
            };

            let mut path_str = relative_to_cwd.to_string_lossy().to_string();

            if !path_str.starts_with("./") && !path_str.starts_with("../") {
                path_str = format!("./{}", path_str);
            }

            if let Some(replacer) = &self.options.module_path_replacer {
                path_str = path_str.replace(&replacer.from, &replacer.to);
            }

            path_str.replace('\\', "/")
        }
    }

    fn get_ssr_setting(&self, options_obj: &ObjectLit, method_name: &str) -> bool {
        // Look for explicit ssr property in options
        for prop in &options_obj.props {
            if let PropOrSpread::Prop(prop) = prop {
                if let Prop::KeyValue(kv) = &**prop {
                    if let PropName::Ident(ident) = &kv.key {
                        if ident.sym == "ssr" {
                            if let Expr::Lit(Lit::Bool(Bool { value, .. })) = &*kv.value {
                                return *value;
                            }
                        }
                    }
                }
            }
        }

        // Use default for the method
        self.get_default_ssr(method_name)
    }

    fn add_module_id_to_options(&self, args: &mut Vec<ExprOrSpread>, module_id: String) {
        if args.len() < 2 {
            // Add empty options object if not present
            args.push(ExprOrSpread {
                spread: None,
                expr: Box::new(Expr::Object(ObjectLit {
                    span: Default::default(),
                    props: vec![],
                })),
            });
        }

        if let Some(ExprOrSpread { expr: options_expr, .. }) = args.get_mut(1) {
            if let Expr::Object(obj_lit) = &mut **options_expr {
                // Add moduleId property
                obj_lit.props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(
                    KeyValueProp {
                        key: PropName::Ident(Ident::new(MODULE_ID_KEY.into(), Default::default())),
                        value: Box::new(Expr::Lit(Lit::Str(Str {
                            span: Default::default(),
                            value: module_id.into(),
                            raw: None,
                        }))),
                    },
                ))));
            }
        }
    }

    fn transform_loader_for_server(&self, loader_expr: &mut Expr, ssr_enabled: bool) {
        if self.options.client {
            return; // No transformation needed on client
        }

        match loader_expr {
            Expr::Arrow(arrow_func) => {
                if ssr_enabled {
                    // Check for complex .then() chains first
                    match &*arrow_func.body {
                        BlockStmtOrExpr::Expr(expr) => {
                            if let Some(transformed) = self.transform_then_chain_to_sync(expr) {
                                *loader_expr = transformed;
                                return;
                            }
                        }
                        _ => {}
                    }
                    // Fallback to simple transform
                    self.transform_arrow_function_for_ssr(arrow_func);
                } else if self.options.noop_redundant_loaders {
                    // Replace with noop function: () => () => null
                    let noop_component = ArrowExpr {
                        span: Default::default(),
                        params: vec![],
                        body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::Lit(Lit::Null(Null {
                            span: Default::default(),
                        }))))),
                        is_async: false,
                        is_generator: false,
                        type_params: None,
                        return_type: None,
                    };

                    *arrow_func = ArrowExpr {
                        span: arrow_func.span,
                        params: vec![],
                        body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::Arrow(noop_component)))),
                        is_async: false,
                        is_generator: false,
                        type_params: None,
                        return_type: None,
                    };
                }
            }
            Expr::Fn(func_expr) => {
                if ssr_enabled {
                    // Transform function expression for SSR
                    if let Some(body) = &mut func_expr.function.body {
                        self.transform_function_body_for_ssr(body);
                    }
                } else if self.options.noop_redundant_loaders {
                    // Replace with noop function
                    func_expr.function.body = Some(BlockStmt {
                        span: Default::default(),
                        stmts: vec![Stmt::Return(ReturnStmt {
                            span: Default::default(),
                            arg: Some(Box::new(Expr::Arrow(ArrowExpr {
                                span: Default::default(),
                                params: vec![],
                                body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::Lit(Lit::Null(Null {
                                    span: Default::default(),
                                }))))),
                                is_async: false,
                                is_generator: false,
                                type_params: None,
                                return_type: None,
                            }))),
                        })],
                    });
                }
            }
            _ => {
                // Handle other function types if needed
            }
        }
    }

    fn transform_arrow_function_for_ssr(&self, arrow_func: &mut ArrowExpr) {
        match &mut *arrow_func.body {
            BlockStmtOrExpr::BlockStmt(block) => {
                self.transform_function_body_for_ssr(block);
            }
            BlockStmtOrExpr::Expr(expr) => {
                self.transform_expression_for_ssr(expr);
            }
        }
    }

    fn transform_function_body_for_ssr(&self, body: &mut BlockStmt) {
        for stmt in &mut body.stmts {
            match stmt {
                Stmt::Return(ret_stmt) => {
                    if let Some(arg) = &mut ret_stmt.arg {
                        self.transform_expression_for_ssr(arg);
                    }
                }
                Stmt::Expr(expr_stmt) => {
                    self.transform_expression_for_ssr(&mut expr_stmt.expr);
                }
                _ => {}
            }
        }
    }

    fn transform_expression_for_ssr(&self, expr: &mut Expr) {
        match expr {
            Expr::Call(call_expr) => {
                if let Callee::Import(_) = &call_expr.callee {
                    // Replace import() with require()
                    call_expr.callee = Callee::Expr(Box::new(Expr::Ident(Ident::new(
                        "require".into(),
                        Default::default(),
                    ))));
                } else {
                    // Check if this is a .then() call chain on import()
                    if let Some(transformed) = self.transform_then_chain_to_sync(expr) {
                        *expr = transformed;
                        return;
                    }
                }
            }
            Expr::Member(member_expr) => {
                // Handle .then() calls on import()
                self.transform_expression_for_ssr(&mut member_expr.obj);

                if let MemberProp::Ident(prop) = &member_expr.prop {
                    if prop.sym == "then" {
                        // This is a .then() call, we need to handle the transformation
                        // For now, we'll just transform the object (the import() call)
                    }
                }
            }
            _ => {}
        }
    }

    fn transform_then_chain_to_sync(&self, expr: &Expr) -> Option<Expr> {
        // Check if this expression is part of a .then() chain starting with import()
        let mut chain_parts = Vec::new();
        let mut current_expr = expr;
        let mut import_path = None;

        // Walk up the .then() chain to collect all parts
        loop {
            match current_expr {
                Expr::Call(call_expr) => {
                    if let Callee::Import(_) = &call_expr.callee {
                        // Found the import() at the base - extract the path
                        if let Some(ExprOrSpread { expr: arg, .. }) = call_expr.args.first() {
                            if let Expr::Lit(Lit::Str(str_lit)) = &**arg {
                                import_path = Some(str_lit.value.to_string());
                            }
                        }
                        break;
                    } else if let Callee::Expr(callee_expr) = &call_expr.callee {
                        if let Expr::Member(member_expr) = &**callee_expr {
                            if let MemberProp::Ident(prop) = &member_expr.prop {
                                if prop.sym == "then" {
                                    // This is a .then() call - collect the callback
                                    if let Some(ExprOrSpread { expr: callback, .. }) = call_expr.args.first() {
                                        chain_parts.push(callback.as_ref().clone());
                                    }
                                    current_expr = &member_expr.obj;
                                    continue;
                                }
                            }
                        }
                    }
                    return None;
                }
                _ => return None,
            }
        }

        if let Some(path) = import_path {
            // Reverse the chain parts since we collected them backwards
            chain_parts.reverse();

            if !chain_parts.is_empty() {
                return Some(self.create_sync_function_with_temps(&path, &chain_parts));
            }
        }

        None
    }

    fn create_sync_function_with_temps(&self, import_path: &str, chain_parts: &[Expr]) -> Expr {
        let mut stmts = Vec::new();
        let mut temp_var_names = Vec::new();

        // Create _temp variable for the require() call
        let temp1_name = "_temp".to_string();
        temp_var_names.push(Ident::new(temp1_name.clone().into(), Default::default()));

        let mut declarators = vec![VarDeclarator {
            span: Default::default(),
            name: Pat::Ident(BindingIdent {
                id: Ident::new(temp1_name.into(), Default::default()),
                type_ann: None,
            }),
            init: Some(Box::new(Expr::Call(CallExpr {
                span: Default::default(),
                callee: Callee::Expr(Box::new(Expr::Ident(Ident::new("require".into(), Default::default())))),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Lit(Lit::Str(Str {
                        span: Default::default(),
                        value: import_path.into(),
                        raw: None,
                    }))),
                }],
                type_args: None,
            }))),
            definite: false,
        }];

        // Create temp variables for each .then() callback
        for (i, callback) in chain_parts.iter().enumerate() {
            let temp_name = format!("_temp{}", i + 2);
            temp_var_names.push(Ident::new(temp_name.clone().into(), Default::default()));

            declarators.push(VarDeclarator {
                span: Default::default(),
                name: Pat::Ident(BindingIdent {
                    id: Ident::new(temp_name.into(), Default::default()),
                    type_ann: None,
                }),
                init: Some(Box::new(callback.clone())),
                definite: false,
            });
        }

        // Create the var declaration
        stmts.push(Stmt::Decl(Decl::Var(Box::new(VarDecl {
            span: Default::default(),
            kind: VarDeclKind::Var,
            declare: false,
            decls: declarators,
        }))));

        // Create the chained function call
        let mut result_expr = Expr::Ident(temp_var_names[0].clone());

        for temp_var in temp_var_names.iter().skip(1) {
            result_expr = Expr::Call(CallExpr {
                span: Default::default(),
                callee: Callee::Expr(Box::new(Expr::Ident(temp_var.clone()))),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: Box::new(result_expr),
                }],
                type_args: None,
            });
        }

        // Create return statement
        stmts.push(Stmt::Return(ReturnStmt {
            span: Default::default(),
            arg: Some(Box::new(result_expr)),
        }));

        // Return the new arrow function
        Expr::Arrow(ArrowExpr {
            span: Default::default(),
            params: vec![],
            body: Box::new(BlockStmtOrExpr::BlockStmt(BlockStmt {
                span: Default::default(),
                stmts,
            })),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })
    }
}

impl VisitMut for TransformVisitor {
    fn visit_mut_import_decl(&mut self, import_decl: &mut ImportDecl) {
        if import_decl.src.value == PACKAGE_NAME {
            // Track imports from react-loosely-lazy
            for specifier in &import_decl.specifiers {
                if let ImportSpecifier::Named(named_spec) = specifier {
                    let imported_name = match &named_spec.imported {
                        Some(ModuleExportName::Ident(ident)) => ident.sym.to_string(),
                        _ => named_spec.local.sym.to_string(),
                    };

                    // Check if this is one of our lazy methods
                    if DEFAULT_SSR_SETTINGS.iter().any(|(method, _)| *method == imported_name) {
                        self.lazy_imports.insert(
                            named_spec.local.sym.to_string(),
                            imported_name,
                        );
                    }
                }
            }
        }

        import_decl.visit_mut_children_with(self);
    }

    fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
        // Check if this is a call to one of our lazy methods
        if let Callee::Expr(expr) = &call_expr.callee {
            if let Expr::Ident(ident) = &**expr {
                if let Some(method_name) = self.is_lazy_method_call(ident) {
                    // Validate we have at least a loader argument
                    if call_expr.args.is_empty() {
                        // This should be an error - but for now we'll just skip
                        call_expr.visit_mut_children_with(self);
                        return;
                    }

                    // Extract import path first (without mutable borrow)
                    let import_path = if let Some(ExprOrSpread { expr: loader_expr, .. }) = call_expr.args.first() {
                        self.extract_import_path_from_loader_expr(loader_expr)
                    } else {
                        None
                    };

                    if let Some(import_path) = import_path {
                        // Generate module ID
                                let module_id = self.generate_module_id(&import_path);

                        // Determine SSR setting (before we mutably borrow)
                        let ssr_enabled = if call_expr.args.len() >= 2 {
                            if let Some(ExprOrSpread { expr: options_expr, .. }) = call_expr.args.get(1) {
                                if let Expr::Object(obj_lit) = &**options_expr {
                                    self.get_ssr_setting(obj_lit, method_name)
                                } else {
                                    self.get_default_ssr(method_name)
                                }
                            } else {
                                self.get_default_ssr(method_name)
                            }
                        } else {
                            self.get_default_ssr(method_name)
                        };

                        // Add module ID to options
                        self.add_module_id_to_options(&mut call_expr.args, module_id);

                        // Apply server-side transformations
                        if let Some(ExprOrSpread { expr: loader_expr, .. }) = call_expr.args.first_mut() {
                            self.transform_loader_for_server(loader_expr, ssr_enabled);
                        }
                    }
                }
            }
        }

        call_expr.visit_mut_children_with(self);
    }
}

impl TransformVisitor {
    // Helper method to extract import path from different types of loader expressions
    fn extract_import_path_from_loader_expr(&self, loader_expr: &Expr) -> Option<String> {
        match loader_expr {
            Expr::Arrow(arrow_func) => {
                match &*arrow_func.body {
                    BlockStmtOrExpr::Expr(expr) => self.extract_import_from_expr(expr),
                    BlockStmtOrExpr::BlockStmt(block) => {
                        // Look for return statements with import calls
                        for stmt in &block.stmts {
                            if let Stmt::Return(ret_stmt) = stmt {
                                if let Some(arg) = &ret_stmt.arg {
                                    if let Some(path) = self.extract_import_from_expr(arg) {
                                        return Some(path);
                                    }
                                }
                            }
                        }
                        None
                    }
                }
            }
            Expr::Fn(func_expr) => {
                if let Some(body) = &func_expr.function.body {
                    for stmt in &body.stmts {
                        if let Stmt::Return(ret_stmt) = stmt {
                            if let Some(arg) = &ret_stmt.arg {
                                if let Some(path) = self.extract_import_from_expr(arg) {
                                    return Some(path);
                                }
                            }
                        }
                    }
                }
                None
            }
            _ => None,
        }
    }
}

#[plugin_transform]
pub fn process_transform(
    program: Program,
    metadata: TransformPluginProgramMetadata,
) -> Program {
    let options: PluginOptions = serde_json::from_str(
        &metadata
            .get_transform_plugin_config()
            .unwrap_or_else(|| "{}".to_string()),
    )
    .unwrap_or_default();

    use swc_core::common::plugin::metadata::TransformPluginMetadataContextKind;
    let filename = metadata.get_context(&TransformPluginMetadataContextKind::Filename);

    program.fold_with(&mut as_folder(TransformVisitor::new(options, filename)))
}

fn test_transform_with_options(
    input: &str,
    expected: &str,
    options: PluginOptions,
) {
    #[cfg(test)]
    {
        use swc_core::ecma::{
            parser::{EsSyntax, Syntax},
            transforms::testing::test_transform,
        };

        test_transform(
            Syntax::Es(EsSyntax {
                jsx: true,
                ..Default::default()
            }),
            |_| {
                as_folder(TransformVisitor::new(
                    options,
                    Some("test.js".to_string()),
                ))
            },
            input,
            expected,
            false,
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adds_module_id_to_lazy_for_paint_client() {
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'));
"#;
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'), {
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: true,
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_transforms_import_to_require_on_server() {
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'));
"#;
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => require('./async'), {
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: false, // server-side
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_lazy_method_with_no_ssr() {
        let input = r#"
import { lazy } from 'react-loosely-lazy';

const TestComponent = lazy(() => import('./async'));
"#;
        let expected = r#"
import { lazy } from 'react-loosely-lazy';

const TestComponent = lazy(() => () => null, {
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: false, // server-side
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_lazyafterpaint_with_ssr_enabled() {
        let input = r#"
import { lazyAfterPaint } from 'react-loosely-lazy';

const TestComponent = lazyAfterPaint(() => import('./async'));
"#;
        let expected = r#"
import { lazyAfterPaint } from 'react-loosely-lazy';

const TestComponent = lazyAfterPaint(() => require('./async'), {
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: false, // server-side
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_npm_package_import() {
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('react'));
"#;
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('react'), {
    moduleId: "./node_modules/react/index.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: true,
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_explicit_ssr_option() {
        let input = r#"
import { lazy } from 'react-loosely-lazy';

const TestComponent = lazy(() => import('./async'), { ssr: true });
"#;
        let expected = r#"
import { lazy } from 'react-loosely-lazy';

const TestComponent = lazy(() => require('./async'), {
    ssr: true,
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: false, // server-side
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_explicit_no_ssr_option() {
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'), { ssr: false });
"#;
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => () => null, {
    ssr: false,
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: false, // server-side
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_module_path_replacer() {
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'));
"#;
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'), {
    moduleId: "src/async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: true,
                module_path_replacer: Some(ModulePathReplacer {
                    from: "./".to_string(),
                    to: "src/".to_string(),
                }),
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_existing_options_preserved() {
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'), { someOption: true });
"#;
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const TestComponent = lazyForPaint(() => import('./async'), {
    someOption: true,
    moduleId: "./async.js"
});
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: true,
                ..Default::default()
            },
        );
    }

    #[test]
    fn test_against_babel_fixture_relative_file_import() {
        // This test matches the babel fixture: packages/plugins/babel/__tests__/__fixtures__/relative-file-import
        let input = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const RelativeFileImport = lazyForPaint(() =>
  import('./__mocks__/imports/js-component')
);
"#;

        // For server-side (matching the babel fixture output)
        let expected = r#"
import { lazyForPaint } from 'react-loosely-lazy';

const RelativeFileImport = lazyForPaint(
  () => require('./__mocks__/imports/js-component'),
  {
    moduleId: "./__mocks__/imports/js-component.js",
  }
);
"#;

        test_transform_with_options(
            input,
            expected,
            PluginOptions {
                client: false, // server-side to match fixture
                ..Default::default()
            },
        );
    }

    // TODO: Add error handling tests and more fixture-based tests
}

// Fixture-based tests
mod fixture_tests {
    use super::*;
    use std::fs;


    fn test_fixture_with_options(fixture_dir: &str, options: PluginOptions) {
        let base_path = format!("tests/fixtures/{}", fixture_dir);
        let code_file = format!("{}/code.js", base_path);
        let output_file = format!("{}/output.js", base_path);

        let input = fs::read_to_string(&code_file)
            .unwrap_or_else(|_| panic!("Failed to read code.js from {}", base_path));
        let expected = fs::read_to_string(&output_file)
            .unwrap_or_else(|_| panic!("Failed to read output.js from {}", base_path));

        let _filename = format!("{}/test.js", base_path);

        test_transform_with_options(&input.trim(), &expected.trim(), options);
    }

    fn load_options_for_fixture(fixture_dir: &str) -> PluginOptions {
        let options_file = format!("tests/fixtures/{}/options.json", fixture_dir);

        // Try the fixture directory first
        if let Ok(content) = fs::read_to_string(&options_file) {
            if let Ok(options) = serde_json::from_str::<PluginOptions>(&content) {
                return options;
            }
        }

        // Try parent directories (e.g., client/options.json)
        let parts: Vec<&str> = fixture_dir.split('/').collect();
        for i in 1..parts.len() {
            let parent_dir = parts[..i].join("/");
            let parent_options_file = format!("tests/fixtures/{}/options.json", parent_dir);
            if let Ok(content) = fs::read_to_string(&parent_options_file) {
                if let Ok(options) = serde_json::from_str::<PluginOptions>(&content) {
                    return options;
                }
            }
        }

        PluginOptions::default()
    }

    #[test]
    fn test_client_implicit_ssr_fixture() {
        let options = load_options_for_fixture("client/implicit-ssr");
        test_fixture_with_options("client/implicit-ssr", options);
    }

    #[test]
    fn test_server_implicit_ssr_fixture() {
        let options = load_options_for_fixture("server/implicit-ssr");
        test_fixture_with_options("server/implicit-ssr", options);
    }

    #[test]
    fn test_server_implicit_no_ssr_fixture() {
        let options = load_options_for_fixture("server/implicit-no-ssr");
        test_fixture_with_options("server/implicit-no-ssr", options);
    }

    #[test]
    fn test_server_explicit_ssr_fixture() {
        let options = load_options_for_fixture("server/explicit-ssr");
        test_fixture_with_options("server/explicit-ssr", options);
    }

    #[test]
    fn test_relative_file_import_fixture() {
        let options = load_options_for_fixture("relative-file-import");
        test_fixture_with_options("relative-file-import", options);
    }

    #[test]
    fn test_client_explicit_ssr_fixture() {
        let options = load_options_for_fixture("client/explicit-ssr");
        test_fixture_with_options("client/explicit-ssr", options);
    }

    #[test]
    fn test_client_implicit_no_ssr_fixture() {
        let options = load_options_for_fixture("client/implicit-no-ssr");
        test_fixture_with_options("client/implicit-no-ssr", options);
    }

    #[test]
    fn test_server_explicit_no_ssr_fixture() {
        let options = load_options_for_fixture("server/explicit-no-ssr");
        test_fixture_with_options("server/explicit-no-ssr", options);
    }

    #[test]
    fn test_client_explicit_no_ssr_fixture() {
        let options = load_options_for_fixture("client/explicit-no-ssr");
        test_fixture_with_options("client/explicit-no-ssr", options);
    }

    #[test]
    fn test_client_named_import_fixture() {
        let options = load_options_for_fixture("client/named-import");
        test_fixture_with_options("client/named-import", options);
    }

    #[test]
    fn test_client_chained_named_import_fixture() {
        let options = load_options_for_fixture("client/chained-named-import");
        test_fixture_with_options("client/chained-named-import", options);
    }

    #[test]
    fn test_server_named_import_no_ssr_fixture() {
        let options = load_options_for_fixture("server/named-import-no-ssr");
        test_fixture_with_options("server/named-import-no-ssr", options);
    }

    #[test]
    fn test_relative_ts_file_import_fixture() {
        let options = load_options_for_fixture("relative-ts-file-import");
        test_fixture_with_options("relative-ts-file-import", options);
    }

    #[test]
    fn test_relative_file_import_with_path_replacer_fixture() {
        let options = load_options_for_fixture("relative-file-import-with-path-replacer");
        test_fixture_with_options("relative-file-import-with-path-replacer", options);
    }

    #[test]
    fn test_server_named_import_ssr_fixture() {
        let options = load_options_for_fixture("server/named-import-ssr");
        test_fixture_with_options("server/named-import-ssr", options);
    }

    #[test]
    fn test_server_chained_named_import_ssr_fixture() {
        let options = load_options_for_fixture("server/chained-named-import-ssr");
        test_fixture_with_options("server/chained-named-import-ssr", options);
    }
}
