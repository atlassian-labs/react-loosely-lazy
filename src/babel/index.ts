/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodePath, PluginObj } from '@babel/core';
import * as BabelTypes from '@babel/types';
import { DEFAULT_OPTIONS } from '../lazy';
const PACKAGE_NAME = 'react-loosely-lazy';
const IDENTIFIER_KEY = 'id';
const LAZY_METHODS = ['lazyForPaint', 'lazyAfterPaint', 'lazy'];

export default function({
  types: t,
  template,
}: {
  types: typeof BabelTypes;
  template: any;
}): PluginObj {
  return {
    visitor: {
      ImportDeclaration(path: NodePath<BabelTypes.ImportDeclaration>) {
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
            const lazyOptions = args[1];

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
                IDENTIFIER_KEY
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
            lazyOptions.node.properties.push(
              t.objectProperty(
                t.identifier('id'),
                t.arrowFunctionExpression(
                  [],
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('require'),
                      t.identifier('resolveWeak')
                    ),
                    [t.stringLiteral(importSpecifier)]
                  )
                )
              )
            );

            // adds the module property to options
            lazyOptions.node.properties.push(
              t.objectProperty(
                t.identifier('module'),
                t.stringLiteral(importSpecifier)
              )
            );

            // transforms imports to requires if we are going to SSR
            // @ts-ignore
            if (lazyOptionsPropertiesMap.ssr.node.value.value) {
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
