import React from 'react';
import { render } from '@testing-library/react';
import { LooselyLazy } from '../../init';
import { LazySuspense } from '../../suspense';

import { lazyForPaint, lazyAfterPaint, lazy } from '../../';
import {
  createDefaultServerImport,
  createErrorTests,
  createNamedServerImport,
  createServerLoader,
  testFallbackRender,
  testRender,
  TestRenderOptions,
} from './test-utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: () => true,
}));

describe('lazy* on the server', () => {
  const lazyOptions = {
    moduleId: '@foo/bar',
  };

  afterEach(() => {
    LooselyLazy.init({}); // reset settings
    window.document.head.innerHTML = ''; // reset head
  });

  const createRenderFallbackTests = (
    opts: Pick<TestRenderOptions, 'lazyMethod'>
  ) => {
    describe('when ssr is false', () => {
      it('renders the fallback', async () => {
        await testFallbackRender({
          ssr: false,
          ...opts,
        });
      });

      it('renders the fallback when the loader has been transformed to a noop', async () => {
        const NoopComponent = () => null;
        await testFallbackRender({
          loader: () => NoopComponent,
          ssr: false,
          ...opts,
        });
      });
    });
  };

  const createRenderTests = (
    opts: Pick<TestRenderOptions, 'lazyMethod' | 'ssr'>
  ) => {
    it('renders the default component when there is only a default export', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      await testRender({
        loader: () => createDefaultServerImport({ DefaultComponent }),
        text: 'Default Component',
        ...opts,
      });
    });

    it('renders the named component when there is only a named export', async () => {
      const NamedComponent = () => <div>Named Component</div>;
      await testRender({
        loader: () => createNamedServerImport({ NamedComponent }),
        text: 'Named Component',
        ...opts,
      });
    });

    it('renders the default component when there are default and named exports', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      const NamedComponent = () => <div>Named Component</div>;
      await testRender({
        loader: () =>
          createDefaultServerImport({ DefaultComponent, NamedComponent }),
        text: 'Default Component',
        ...opts,
      });
    });

    it('renders the named component correctly when there are default and named exports', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      const NamedComponent = () => <div>Named Component</div>;
      await testRender({
        loader: () =>
          createNamedServerImport({ DefaultComponent, NamedComponent }),
        text: 'Named Component',
        ...opts,
      });
    });
  };

  describe('lazyForPaint', () => {
    createRenderFallbackTests({
      lazyMethod: lazyForPaint,
    });

    createRenderTests({
      lazyMethod: lazyForPaint,
    });

    createErrorTests({
      lazyMethod: lazyForPaint,
    });

    it('renders preload link tags when a manifest is provided', () => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {
            [lazyOptions.moduleId]: ['1.js', '2.js'],
          },
        },
      });

      const LazyTestComponent = lazyForPaint(createServerLoader(), lazyOptions);

      const { container } = render(
        <LazySuspense fallback="Loading...">
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(container.querySelectorAll('link')).toMatchInlineSnapshot(`
        NodeList [
          <link
            as="script"
            href="/1.js"
            rel="preload"
          />,
          <link
            as="script"
            href="/2.js"
            rel="preload"
          />,
        ]
      `);
    });
  });

  describe('lazyAfterPaint', () => {
    createRenderFallbackTests({
      lazyMethod: lazyAfterPaint,
    });

    createRenderTests({
      lazyMethod: lazyAfterPaint,
    });

    createErrorTests({
      lazyMethod: lazyAfterPaint,
    });

    it('renders prefetch link tags when a manifest is provided', () => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {
            [lazyOptions.moduleId]: ['1.js'],
          },
        },
      });

      const LazyTestComponent = lazyAfterPaint(
        createServerLoader(),
        lazyOptions
      );

      const { container } = render(
        <LazySuspense fallback="Loading...">
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(container.querySelectorAll('link')).toMatchInlineSnapshot(`
        NodeList [
          <link
            as="script"
            href="/1.js"
            rel="prefetch"
          />,
        ]
      `);
    });
  });

  describe('lazy', () => {
    const opts = {
      lazyMethod: lazy,
    };

    it('renders the fallback by default', async () => {
      await testFallbackRender(opts);
    });

    createRenderFallbackTests(opts);

    describe('when ssr is true', () => {
      createRenderTests({
        ...opts,
        ssr: true,
      });

      it('should not render link tags when a manifest is provided', () => {
        LooselyLazy.init({
          manifest: {
            publicPath: '/',
            assets: {
              [lazyOptions.moduleId]: ['1.js', '2.js'],
            },
          },
        });

        const LazyTestComponent = lazy(createServerLoader(), {
          ...lazyOptions,
          ssr: true,
        });

        const { container } = render(
          <LazySuspense fallback="Loading...">
            <LazyTestComponent />
          </LazySuspense>
        );

        expect(container.querySelectorAll('link')).toHaveLength(0);
      });

      createErrorTests({
        lazyMethod: lazyAfterPaint,
      });
    });
  });

  describe('getAssetUrls', () => {
    const createComponent = (moduleId: string) =>
      lazyForPaint(createServerLoader(), {
        moduleId,
      });

    it('returns undefined when given an empty manifest', () => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {},
        },
      });

      const TestComponent = createComponent('./src/app/foo.tsx');

      expect(TestComponent.getAssetUrls()).toBeUndefined();
    });

    it('returns undefined when given a manifest that does not contain the component moduleId', () => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {
            './src/app/bar.tsx': ['async-bar.js'],
          },
        },
      });

      const TestComponent = createComponent('./src/app/foo.tsx');

      expect(TestComponent.getAssetUrls()).toBeUndefined();
    });

    it('returns the assets when given a manifest that contains the component moduleId', () => {
      const moduleId = './src/app/foo.tsx';

      LooselyLazy.init({
        manifest: {
          publicPath: 'https://cdn.example.com/',
          assets: {
            [moduleId]: ['async-bar.js', 'async-baz.js'],
          },
        },
      });

      const TestComponent = createComponent(moduleId);

      expect(TestComponent.getAssetUrls()).toEqual([
        'https://cdn.example.com/async-bar.js',
        'https://cdn.example.com/async-baz.js',
      ]);
    });
  });
});
