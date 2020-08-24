import { Compiler, compilation as webpackCompilation } from 'webpack';
import { PACKAGE_NAME } from '../constants';
import { Asset, Manifest } from './manifest';
import { buildManifest } from './utils';

type Parser = webpackCompilation.normalModuleFactory.Parser;

export type ReactLooselyLazyPluginOptions = {
  filename: string;
};

export class ReactLooselyLazyPlugin {
  name: string = ReactLooselyLazyPlugin.name;
  filename: string;

  constructor(opts: ReactLooselyLazyPluginOptions) {
    this.filename = opts.filename;
  }

  apply(compiler: Compiler) {
    const { name } = this;
    // A mapping of module paths to the set of raw requests that stem from the react-loosely-lazy library
    const moduleImports = new Map<string, Set<string>>();

    const onJavaScriptModule = (parser: Parser) => {
      let currentLibraryExpression: undefined | any;
      let hasLibraryImport = false;

      parser.hooks.import.tap(name, (statement, source) => {
        if (source === PACKAGE_NAME) {
          hasLibraryImport = true;
        }
      });

      parser.hooks.evaluate.for('CallExpression').tap(name, expression => {
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
      parser.hooks.importCall.tap(name, expression => {
        // If a library expression is present, then that means this import call exists within the library expression
        // assuming that the parser always traverses in a depth-first fashion
        if (currentLibraryExpression) {
          const rawRequest = expression.arguments[0].value;
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
      factory.hooks.parser.for('javascript/auto').tap(name, onJavaScriptModule);

      factory.hooks.parser
        .for('javascript/dynamic')
        .tap(name, onJavaScriptModule);

      factory.hooks.parser.for('javascript/esm').tap(name, onJavaScriptModule);
    });

    compiler.hooks.emit.tapAsync(name, (compilation, callback) => {
      const manifest = buildManifest(compiler, compilation, moduleImports);
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
  }
}

export const getAssets = (manifest: Manifest, moduleIds: string[]) =>
  // TODO use flatMap once Node 10 support is dropped
  moduleIds.reduce<Array<string | undefined>>(
    (assets, id) => assets.concat(manifest[id]),
    []
  );

export { Asset, Manifest };
