import { Compiler, compilation as webpackCompilation } from 'webpack';

import { buildManifest, removeQueryParams } from './utils';

type Parser = webpackCompilation.normalModuleFactory.Parser;

export type ReactLooselyLazyPluginOptions = {
  filename: string;
  publicPath?: string;
};

const PACKAGE_NAME = 'react-loosely-lazy';

export class ReactLooselyLazyPlugin {
  name: string = ReactLooselyLazyPlugin.name;
  filename: string;
  publicPath: string | undefined;

  constructor(opts: ReactLooselyLazyPluginOptions) {
    this.filename = opts.filename;
    this.publicPath = opts.publicPath;
  }

  apply(compiler: Compiler) {
    const { name, publicPath } = this;
    // A mapping of module paths to the set of raw requests that stem from the react-loosely-lazy library
    const moduleImports = new Map<string, Set<string>>();

    const onJavaScriptModule = (parser: Parser) => {
      let currentLibraryExpression: undefined | any;
      let hasLibraryImport = false;

      parser.hooks.import.tap(name, (statement: any, source: string) => {
        if (source === PACKAGE_NAME) {
          hasLibraryImport = true;
        }
      });

      parser.hooks.evaluate
        .for('CallExpression')
        .tap(name, (expression: any) => {
          // Perform an earlier bailout than checking the harmony specifiers
          if (!hasLibraryImport) {
            return;
          }

          const calleeName = expression.callee.name;
          // @ts-expect-error Parser types are not defined correctly
          const { harmonySpecifier } = parser.state;
          // TODO Someday handle proxies, and defined webpack aliases
          if (
            harmonySpecifier &&
            harmonySpecifier.has(calleeName) &&
            harmonySpecifier.get(calleeName).source === PACKAGE_NAME
          ) {
            currentLibraryExpression = expression;
          }
        });

      // This is a slightly hacky, but convenient way to get the import statement of a library expression as it does not
      // require walking the call expression ourselves.
      parser.hooks.importCall.tap(name, (expression: any) => {
        // If a library expression is present, then that means this import call exists within the library expression
        // assuming that the parser always traverses in a depth-first fashion
        if (currentLibraryExpression) {
          const rawRequest = removeQueryParams(expression.arguments[0].value);
          // @ts-expect-error Parser types are not defined correctly
          const { module } = parser.state;
          if (!moduleImports.has(module.resource)) {
            moduleImports.set(module.resource, new Set([rawRequest]));
          } else {
            const rawRequests = moduleImports.get(module.resource)!;
            rawRequests.add(rawRequest);
          }
        }
        currentLibraryExpression = undefined;
      });
    };

    compiler.hooks.normalModuleFactory.tap(name, factory => {
      // https://webpack.js.org/configuration/module/#ruletype
      // https://github.com/webpack/webpack/releases/tag/v4.0.0
      // @ts-ignore Incompatible types are being inferred from tapable
      factory.hooks.parser.for('javascript/auto').tap(name, onJavaScriptModule);

      factory.hooks.parser
        .for('javascript/dynamic')
        // @ts-expect-error Incompatible types are being inferred from tapable
        .tap(name, onJavaScriptModule);

      // @ts-expect-error Incompatible types are being inferred from tapable
      factory.hooks.parser.for('javascript/esm').tap(name, onJavaScriptModule);
    });

    compiler.hooks.emit.tapAsync(name, (compilation, callback) => {
      const manifest = buildManifest(compiler, compilation, {
        moduleImports,
        publicPath,
      });
      const json = JSON.stringify(manifest, null, 2);

      compilation.assets[this.filename] = {
        source() {
          return json;
        },
        size() {
          return json.length;
        },
      };

      callback();
    });

    // @ts-expect-error Incompatible types are being inferred from tapable
    compiler.hooks.thisCompilation.tap(name, compilation => {
      // modifies the webpack bootstrap code generated to expose jsonpScriptSrc
      // only needed on Webpack 4.x as Webpack 5+ has official support.
      // use stage 1 to ensure this executes after webpack/lib/web/JsonpMainTemplatePlugin.js
      compilation.mainTemplate.hooks.localVars.tap(
        { name, stage: 1 },
        (source: string) => {
          let modSource = source;
          if (source.includes('function jsonpScriptSrc')) {
            modSource +=
              '\n window.__webpack_get_script_filename__ = jsonpScriptSrc;';
          }

          return modSource;
        }
      );
    });
  }
}
