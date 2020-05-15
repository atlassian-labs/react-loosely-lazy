/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodePath, PluginObj } from '@babel/core';
import * as BabelTypes from '@babel/types';
import { dirname, relative } from 'path';
import { lstatSync } from 'fs';

const PACKAGE_NAME = 'react-loosely-lazy';
const BUNDLER_CACHE_ID_KEY = 'getCacheId';
const MODULE_ID_KEY = 'moduleId';
const LAZY_METHODS = ['lazyForPaint', 'lazyAfterPaint', 'lazy'];
const DEFAULT_OPTIONS: {
  [key: string]: { ssr: boolean; defer: number };
} = {
  lazyForPaint: { ssr: true, defer: 0 },
  lazyAfterPaint: { ssr: true, defer: 1 },
  lazy: { ssr: false, defer: 2 },
};

function hasDotSlashPrefix(path: string): boolean {
  return path.substring(0, 2) === './';
}

function addDotSlashPrefix(path: string): string {
  return hasDotSlashPrefix(path) ? path : `./${path}`;
}

function removeDotSlashPrefix(path: string): string {
  return hasDotSlashPrefix(path) ? path.replace('./', '') : path;
}

function withModuleExtension(filePath: string): string {
  const extensions = ['.js', '.ts', '.tsx'];

  const extension = extensions.find(ext => {
    try {
      return lstatSync(`${filePath}${ext}`).isFile();
    } catch {
      return false;
    }
  });

  return `${filePath}${extension}`;
}

function getModulePath(importSpecifier: string, filename: string): string {
  const filePath = `${dirname(filename)}/${removeDotSlashPrefix(
    importSpecifier
  )}`;
  let modulePath;

  // app dependency import eg., import('my-dependency') where my-dependency is a dependency in package.json
  try {
    modulePath = require.resolve(importSpecifier);
  } catch {
    try {
      const isDirectory = lstatSync(filePath).isDirectory();

      // module entry import eg., import('./module') where module has index.js
      if (isDirectory) {
        modulePath = withModuleExtension(`${filePath}/index`);
      }
    } catch {
      // we handle this below
    }
  }

  if (!modulePath) {
    // relative import eg., import('./async') which is relative to the file being transpiled (filename)
    modulePath = withModuleExtension(filePath);
  }

  return addDotSlashPrefix(relative(process.cwd(), modulePath));
}

export default function ({
  types: t,
  template,
}: {
  types: typeof BabelTypes;
  template: any;
}): PluginObj {
  return {
    visitor: {
      ImportDeclaration(
        path: NodePath<BabelTypes.ImportDeclaration>,
        state: {
          opts?: {
            client?: boolean;
          };
          filename?: string;
        }
      ) {
        const { client } = state.opts || {};
        const { filename } = state;
        const source = path.node.source.value;

        if (source !== PACKAGE_NAME) {
          return;
        }

        const bindingNames = LAZY_METHODS;
        const bindings = bindingNames
          .map(name => path.scope.getBinding(name))
          .filter(binding => binding);

        bindings.forEach((binding: any) => {
          const lazyMethodName = binding.identifier.name;

          binding.referencePaths.forEach((refPath: any) => {
            let callExpression = refPath.parentPath;

            if (
              callExpression.isMemberExpression() &&
              callExpression.node.computed === false &&
              callExpression.get('property').isIdentifier({ name: 'Map' })
            ) {
              callExpression = callExpression.parentPath;
            }

            if (!callExpression.isCallExpression()) {
              return;
            }

            const args = callExpression.get('arguments');

            if (!args.length) {
              throw callExpression.error;
            }

            const lazyImport = args[0];
            let lazyOptions = args[1];

            // ensures that options exist even if not passed explicitly
            if (!lazyOptions || !lazyOptions.isObjectExpression()) {
              callExpression.node.arguments.push(t.objectExpression([]));
              lazyOptions = callExpression.get('arguments')[1];
            }

            if (!lazyImport.isFunction()) {
              return;
            }

            let lazyImportPath = null;

            lazyImport.traverse({
              Import(importPath: NodePath<BabelTypes.ImportDeclaration>) {
                lazyImportPath = importPath.parentPath;
              },
            });

            if (!lazyImportPath) {
              return;
            }

            const importSpecifier = (lazyImportPath as any).get('arguments')[0]
              .node.value;
            const lazyOptionsProperties = lazyOptions.get('properties');
            const lazyOptionsPropertiesMap: {
              [key: string]: NodePath<
                | BabelTypes.ObjectProperty
                | BabelTypes.ObjectMethod
                | BabelTypes.SpreadProperty
              >;
            } = {};

            lazyOptionsProperties.forEach((property: any) => {
              if (property.type !== 'SpreadProperty') {
                const key = property.get('key');

                lazyOptionsPropertiesMap[key.node.name] = property;
              }
            });

            if (
              Object.prototype.isPrototypeOf.call(
                lazyOptionsPropertiesMap,
                BUNDLER_CACHE_ID_KEY
              )
            ) {
              return;
            }

            // ensures the ssr property is inherited from the method's default even if not supplied
            if (typeof lazyOptionsPropertiesMap.ssr === 'undefined') {
              lazyOptions.node.properties.push(
                t.objectProperty(
                  t.identifier('ssr'),
                  t.booleanLiteral(DEFAULT_OPTIONS[lazyMethodName].ssr)
                )
              );
            }

            // adds the id property to options
            const importSpecifierStringLiteral = t.stringLiteral(
              importSpecifier
            );
            const findLazyImportInWebpackCache = template.expression`function () {
              if (require && require.resolveWeak) {
                return require.resolveWeak(${importSpecifierStringLiteral});
              }

              return ${importSpecifierStringLiteral};
            }`;

            lazyOptions.node.properties.push(
              t.objectProperty(
                t.identifier(BUNDLER_CACHE_ID_KEY),
                findLazyImportInWebpackCache()
              )
            );

            if (!filename) {
              throw new Error(
                `Babel transpilation target for ${importSpecifier} not found`
              );
            }

            // adds the moduleId property to options
            lazyOptions.node.properties.push(
              t.objectProperty(
                t.identifier(MODULE_ID_KEY),
                t.stringLiteral(getModulePath(importSpecifier, filename))
              )
            );

            // there is no require on the client
            if (client) {
              return;
            }

            const ssrOptionIndex = lazyOptions.node.properties.findIndex(
              (property: any) => property.key.name === 'ssr'
            );

            // transforms imports to requires if we are going to SSR
            if (lazyOptions.node.properties[ssrOptionIndex].value.value) {
              const lazyImportOverride = template`{const resolved = require(${t.stringLiteral(
                importSpecifier
              )});const then = (fn) => fn(resolved);return {...resolved, then }}`;

              lazyImport.node.body = lazyImportOverride();
            }
          });
        });
      },
    },
  };
}
