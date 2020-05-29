import { transformAsync } from '@babel/core';
// @ts-ignore - babel-plugin-tester doesn't export types
import pluginTester from 'babel-plugin-tester';
import plugin from '../';
import path from 'path';

pluginTester({
  plugin,
  pluginName: 'react-loosely-lazy',
  fixtures: path.join(__dirname, '__fixtures__'),
  snapshot: true,
});

describe.each(['server', 'client'])('on the %s', (env: string) => {
  const babel = (code: string) =>
    transformAsync(code, {
      babelrc: false,
      caller: {
        name: 'tests',
        supportsStaticESM: true,
      },
      configFile: false,
      filename: 'test.js',
      plugins: [[plugin, { client: env === 'client' }]],
      sourceType: 'module',
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
