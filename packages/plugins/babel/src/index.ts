import { types as BabelTypes } from '@babel/core';
import type { NodePath, PluginObj } from '@babel/core';
import { ResolveOptions } from 'enhanced-resolve';

import {
  createCustomResolver,
  getModulePath,
  GetModulePathOptions,
  isPresent,
} from './utils';

const MODULE_ID_KEY = 'moduleId';
const DEFAULT_OPTIONS = {
  lazyForPaint: { ssr: true },
  lazyAfterPaint: { ssr: true },
  lazy: { ssr: false },
};
const LAZY_METHODS = Object.keys(DEFAULT_OPTIONS);
const PACKAGE_NAME = 'react-loosely-lazy';

export type ModulePathReplacer = {
  from: string;
  to: string;
};

export type BabelPluginOptions = Partial<{
  client: boolean;
  modulePathReplacer: ModulePathReplacer;
  noopRedundantLoaders: boolean;
  resolverOptions: Partial<ResolveOptions> | undefined;
  resolver: string | undefined;
}>;

export default function ({
  types: t,
}: {
  types: typeof BabelTypes;
}): PluginObj {
  function getCallExpression(path: NodePath) {
    let maybeCallExpression = path.parentPath;

    if (
      maybeCallExpression.isMemberExpression() &&
      !maybeCallExpression.node.computed &&
      t.isIdentifier(maybeCallExpression.get('property'), { name: 'Map' })
    ) {
      maybeCallExpression = maybeCallExpression.parentPath;
    }

    return maybeCallExpression;
  }

  function getLazyArguments(
    callExpression: NodePath<BabelTypes.CallExpression>
  ): [NodePath<BabelTypes.Function>, NodePath<BabelTypes.ObjectExpression>] {
    const args = callExpression.get<'arguments'>('arguments');
    const loader = args[0];
    let options = args[1];

    if (!loader.isFunction()) {
      throw new Error('Loader argument must be a function');
    }

    if (!options || !options.isObjectExpression()) {
      callExpression.node.arguments.push(t.objectExpression([]));
      options = callExpression.get<'arguments'>('arguments')[1];

      return [loader, options as NodePath<BabelTypes.ObjectExpression>];
    }

    return [loader, options];
  }

  type PropertiesMap = Map<
    string,
    NodePath<BabelTypes.ObjectMethod | BabelTypes.ObjectProperty>
  >;

  function getPropertiesMap(
    options: NodePath<BabelTypes.ObjectExpression>
  ): PropertiesMap {
    const properties = options.get<'properties'>('properties');

    return properties.reduce<PropertiesMap>((map, property) => {
      if (property.isSpreadElement()) {
        throw new Error(
          'Options argument does not support SpreadElement as it is not statically analyzable'
        );
      }

      // @ts-expect-error TypeScript type narrowing does not work correctly here
      map.set(property.node.key.name, property);

      return map;
    }, new Map());
  }

  function getSSR(map: PropertiesMap, lazyMethodName: string): boolean {
    const property = map.get('ssr');
    if (!property) {
      // @ts-ignore This should be available
      return DEFAULT_OPTIONS[lazyMethodName].ssr;
    }

    if (property.isObjectMethod()) {
      throw new Error('Unable to statically analyze ssr option');
    }

    // @ts-expect-error TypeScript type narrowing does not work correctly here
    const value = property.node.value;
    if (!t.isBooleanLiteral(value)) {
      throw new Error('Unable to statically analyze ssr option');
    }

    return value.value;
  }

  type TransformLoaderOptions = {
    env: 'client' | 'server';
    loader: NodePath<BabelTypes.Function>;
    noopRedundantLoaders: boolean;
    ssr: boolean;
  };

  // TODO Remove the require hack when this library drops non-streaming support
  function transformLoader({
    env,
    loader,
    noopRedundantLoaders,
    ssr,
  }: TransformLoaderOptions): { importPath: string | void } {
    let importPath;

    loader.traverse({
      Import(nodePath: NodePath<BabelTypes.Import>) {
        const maybeImportCallExpression = nodePath.parentPath;
        if (!maybeImportCallExpression.isCallExpression()) {
          return;
        }

        // Get the import path when the parent is a CallExpression and its first
        // argument is a StringLiteral
        const maybeImportPath =
          maybeImportCallExpression.get<'arguments'>('arguments')[0];
        if (maybeImportPath.isStringLiteral()) {
          importPath = maybeImportPath.node.value;
        }

        // Do not transform the loader on the client
        if (env === 'client') {
          return;
        }

        // When on the server, either do nothing or replace the loader with a noop
        if (!ssr) {
          if (noopRedundantLoaders) {
            const noopComponent = t.arrowFunctionExpression(
              [],
              t.nullLiteral()
            );
            loader.replaceWith(t.arrowFunctionExpression([], noopComponent));
          }

          return;
        }

        // Replace the import with a require
        nodePath.replaceWith(t.identifier('require'));

        // Transform all then calls to be synchronous in order to support
        // named exports
        let maybeMemberExpression: NodePath<BabelTypes.Node> =
          nodePath.parentPath.parentPath;
        let previousIdOrExpression;
        while (maybeMemberExpression.isMemberExpression()) {
          const { property } = maybeMemberExpression.node;
          if (!t.isIdentifier(property, { name: 'then' })) {
            break;
          }

          const maybeCallExpression = maybeMemberExpression.parentPath;
          if (!maybeCallExpression.isCallExpression()) {
            break;
          }

          if (!previousIdOrExpression) {
            const loaderId = loader.scope.generateUidIdentifier();
            nodePath.scope.push({
              id: loaderId,
              init: maybeImportCallExpression.node,
            });
            previousIdOrExpression = loaderId;
          }

          const thenId = loader.scope.generateUidIdentifier();
          const thenArgs = maybeCallExpression.get<'arguments'>('arguments');
          const onFulfilled = thenArgs[0];
          if (onFulfilled.isExpression()) {
            nodePath.scope.push({
              id: thenId,
              init: onFulfilled.node,
            });
          }

          const replacement = t.callExpression(thenId, [
            previousIdOrExpression,
          ]);

          maybeCallExpression.replaceWith(replacement);

          maybeMemberExpression = maybeMemberExpression.parentPath.parentPath;
          previousIdOrExpression = replacement;
        }
      },
      AwaitExpression() {
        throw new Error('Loader argument does not support await expressions');
      },
      MemberExpression(nodePath: NodePath<BabelTypes.MemberExpression>) {
        const maybeCallExpression = nodePath.parentPath;
        if (
          t.isIdentifier(nodePath.node.property, { name: 'then' }) &&
          maybeCallExpression.isCallExpression()
        ) {
          const thenArgs = maybeCallExpression.get<'arguments'>('arguments');
          if (thenArgs.length > 1) {
            throw new Error(
              'Loader argument does not support Promise.prototype.then with more than one argument'
            );
          }
        }

        if (t.isIdentifier(nodePath.node.property, { name: 'catch' })) {
          throw new Error(
            'Loader argument does not support Promise.prototype.catch'
          );
        }
      },
    });

    return {
      importPath,
    };
  }

  function buildModuleIdProperty(opts: GetModulePathOptions) {
    return t.objectProperty(
      t.identifier(MODULE_ID_KEY),
      t.stringLiteral(getModulePath(opts))
    );
  }

  return {
    visitor: {
      ImportDeclaration(
        path: NodePath<BabelTypes.ImportDeclaration>,
        state: {
          opts?: BabelPluginOptions | undefined | false;
          filename?: string;
        }
      ) {
        const {
          client,
          modulePathReplacer,
          noopRedundantLoaders = true,
          resolverOptions = {},
          resolver,
        } = state.opts || {};
        const { filename } = state;
        const source = path.node.source.value;
        const customResolver =
          resolver && typeof resolver === 'string'
            ? require(require.resolve(resolver))
            : createCustomResolver(resolverOptions);

        if (source !== PACKAGE_NAME) {
          return;
        }

        const bindingNames = LAZY_METHODS;
        const bindings = bindingNames
          .map(name => path.scope.getBinding(name))
          .filter(isPresent);

        bindings.forEach(binding => {
          const lazyMethodName = binding.identifier.name;

          binding.referencePaths.forEach((refPath: NodePath) => {
            const callExpression = getCallExpression(refPath);
            if (!callExpression.isCallExpression()) {
              return;
            }

            const [loader, lazyOptions] = getLazyArguments(callExpression);
            const propertiesMap = getPropertiesMap(lazyOptions);

            const { importPath } = transformLoader({
              env: client ? 'client' : 'server',
              loader,
              noopRedundantLoaders,
              ssr: getSSR(propertiesMap, lazyMethodName),
            });

            if (!importPath) {
              return;
            }

            if (!filename) {
              throw new Error(
                `Babel transpilation target for ${importPath} not found`
              );
            }

            // Add the moduleId property to options
            lazyOptions.node.properties.push(
              buildModuleIdProperty({
                filename,
                importPath,
                modulePathReplacer,
                resolver: customResolver,
              })
            );
          });
        });
      },
    },
  };
}
