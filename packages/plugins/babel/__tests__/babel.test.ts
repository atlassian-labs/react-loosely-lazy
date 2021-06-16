import { transformAsync } from '@babel/core';
import pluginTester from 'babel-plugin-tester';
import outdent from 'outdent';
import { join } from 'path';

import plugin from '../src';
import type { BabelPluginOptions } from '../src';

pluginTester({
  plugin,
  pluginName: 'react-loosely-lazy/babel-plugin',
  fixtures: join(__dirname, '__fixtures__'),
  snapshot: true,
});

describe.each(['server', 'client'])('on the %s', (env: string) => {
  type BabelOptions = Partial<{ filename: string }> & BabelPluginOptions;

  const babel = (
    code: string,
    { filename = 'test.js', ...options }: BabelOptions = {}
  ) =>
    transformAsync(code, {
      babelrc: false,
      caller: {
        name: 'tests',
        supportsStaticESM: true,
      },
      configFile: false,
      filename,
      plugins: [[plugin, { client: env === 'client', ...options }]],
      sourceType: 'module',
    });

  describe('correctly generates the moduleId when running babel from a different cwd', () => {
    const transformedImport = env === 'client' ? 'import' : 'require';

    const mockCwd = (cwd: string) => {
      jest.spyOn(process, 'cwd').mockImplementation(() => cwd);
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('by default', async () => {
      const mocksDir = join(__dirname, '__mocks__');
      // Pretend we are running babel from the __mocks__/test directory
      mockCwd(join(mocksDir, 'test'));

      await expect(
        babel(
          `
            import { lazyForPaint } from 'react-loosely-lazy';

            const TestComponent = lazyForPaint(() => import('./async'));
          `,
          {
            // Pretend the file being transpiled is in the __mocks__/app directory
            filename: join(mocksDir, 'app', 'index.js'),
          }
        )
      ).resolves.toMatchObject({
        code: outdent`
          import { lazyForPaint } from 'react-loosely-lazy';
          const TestComponent = lazyForPaint(() => ${transformedImport}('./async'), {
            moduleId: "../app/async.js"
          });
      `,
      });
    });

    it('when given a modulePathReplacer', async () => {
      const mocksDir = join(__dirname, '__mocks__');
      // Pretend we are running babel from the __mocks__/test directory
      mockCwd(join(mocksDir, 'test'));

      await expect(
        babel(
          `
            import { lazyForPaint } from 'react-loosely-lazy';

            const TestComponent = lazyForPaint(() => import('./async'));
          `,
          {
            // Pretend the file being transpiled is in the __mocks__/app directory
            filename: join(mocksDir, 'app', 'index.js'),
            // Since babel is running in the test directory, but the file and its import live in the app directory we
            // want to transform the moduleId so that it matches where the app directory actually lives
            modulePathReplacer: {
              from: '../',
              to: './',
            },
          }
        )
      ).resolves.toMatchObject({
        code: outdent`
          import { lazyForPaint } from 'react-loosely-lazy';
          const TestComponent = lazyForPaint(() => ${transformedImport}('./async'), {
            moduleId: "./app/async.js"
          });
        `,
      });
    });
  });

  describe('throws an error when the loader argument', () => {
    it('is not a function', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint({});
        `)
      ).rejects.toThrow('Loader argument must be a function');
    });

    it('is an async function with a default import', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(
            async () => await import('react'),
            { ssr: true },
          );
        `)
      ).rejects.toThrow('Loader argument does not support await expressions');
    });

    it('is an async function with a named import', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(
            async () => {
              const { Component } = await import('react');

              return Component;
            },
            { ssr: true },
          );
        `)
      ).rejects.toThrow('Loader argument does not support await expressions');
    });

    it('uses a default import with Promise.prototype.then onRejected argument', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(() =>
            import('react').then(Component => Component, () => {})
          );
        `)
      ).rejects.toThrow(
        'Loader argument does not support Promise.prototype.then with more than one argument'
      );
    });

    it('uses a named import with Promise.prototype.then onRejected argument', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(() =>
            import('react').then(({ Component }) => Component, () => {})
          );
        `)
      ).rejects.toThrow(
        'Loader argument does not support Promise.prototype.then with more than one argument'
      );
    });

    it('uses a default import with Promise.prototype.catch', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(() =>
            import('react').catch(() => {})
          );
        `)
      ).rejects.toThrow(
        'Loader argument does not support Promise.prototype.catch'
      );
    });

    it('uses a named import with Promise.prototype.catch', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(() =>
            import('react')
              .then(({ Component }) => Component)
              .catch(() => {})
          );
        `)
      ).rejects.toThrow(
        'Loader argument does not support Promise.prototype.catch'
      );
    });
  });

  describe('throws an error when the options argument', () => {
    it('uses a SpreadElement', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const opts = {};

          const TestComponent = lazyForPaint(
            () => import('react'),
            {
              ...opts,
              ssr: true,
            },
          );
        `)
      ).rejects.toThrow(
        'Options argument does not support SpreadElement as it is not statically analyzable'
      );
    });

    it('ssr option is an ObjectProperty with an Expression value', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(
            () => import('react'),
            {
              ssr: () => {
                return true;
              },
            },
          );
        `)
      ).rejects.toThrow('Unable to statically analyze ssr option');
    });

    it('ssr option is an ObjectMethod', async () => {
      await expect(
        babel(`
          import { lazyForPaint } from 'react-loosely-lazy';

          const TestComponent = lazyForPaint(
            () => import('react'),
            {
              get ssr() {
                return true;
              },
            },
          );
        `)
      ).rejects.toThrow('Unable to statically analyze ssr option');
    });
  });
});
