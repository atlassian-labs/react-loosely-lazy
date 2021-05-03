import LooselyLazy, { PRIORITY } from '../../..';
import {
  createLoaderPreloadStrategy,
  createManifestPreloadStrategy,
  createWebpackPreloadStrategy,
  preloadAsset,
  PreloadStrategy,
} from '..';

let head: string;

beforeEach(() => {
  head = document.head.innerHTML;
});

afterEach(() => {
  document.head.innerHTML = head;

  delete (window as any).__webpack_require__;
  delete (window as any).__webpack_get_script_filename__;

  LooselyLazy.init({
    manifest: {
      publicPath: '/',
      assets: {},
    },
  });
});

const defineWebpack = () => {
  (window as any).__webpack_require__ = {
    e: () => Promise.reject(),
  };
  (window as any).__webpack_get_script_filename__ = (id: string) => `/${id}.js`;
};

describe('createLoaderPreloadStrategy', () => {
  it('returns the strategy', () => {
    const loader = jest.fn();
    const strategy = createLoaderPreloadStrategy({ loader });

    expect(loader).not.toHaveBeenCalled();
    expect(strategy).toEqual(expect.any(Function));
  });

  describe('strategy', () => {
    it('calls the loader', () => {
      const loader = jest.fn();
      const strategy = createLoaderPreloadStrategy({ loader });

      strategy();

      expect(loader).toHaveBeenCalled();
    });

    it('returns a cleanup function that does nothing', () => {
      const strategy = createLoaderPreloadStrategy({ loader: jest.fn() });
      const cleanup = strategy();

      expect(cleanup).not.toThrow();
    });
  });
});

describe('createManifestPreloadStrategy', () => {
  it('throws an unsupported error when the manifest is not initialised', () => {
    expect(() =>
      createManifestPreloadStrategy({
        moduleId: '@foo/bar',
        rel: 'preload',
      })
    ).toThrow('Unsupported preload strategy');
  });

  it('throws an unsupported error when the module does not exist in the manifest', () => {
    LooselyLazy.init({
      manifest: {
        publicPath: '/',
        assets: {},
      },
    });

    expect(() =>
      createManifestPreloadStrategy({
        moduleId: '@foo/bar',
        rel: 'preload',
      })
    ).toThrow('Unsupported preload strategy');
  });

  it('returns the strategy when the module is in the manifest', () => {
    LooselyLazy.init({
      manifest: {
        publicPath: '/',
        assets: {
          '@foo/bar': ['1.js'],
        },
      },
    });

    const strategy = createManifestPreloadStrategy({
      moduleId: '@foo/bar',
      rel: 'preload',
    });

    expect(document.head).toMatchInlineSnapshot(`<head />`);
    expect(strategy).toEqual(expect.any(Function));
  });

  describe('strategy', () => {
    let strategy: PreloadStrategy;

    beforeEach(() => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {
            '@foo/bar': [
              'async-manifest-strategy-1.js',
              'async-manifest-strategy-2.js',
            ],
          },
        },
      });

      strategy = createManifestPreloadStrategy({
        moduleId: '@foo/bar',
        rel: 'preload',
      });
    });

    it('inserts the manifest module assets as link tags', () => {
      strategy();

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/async-manifest-strategy-1.js"
            rel="preload"
          />
          <link
            href="/async-manifest-strategy-2.js"
            rel="preload"
          />
        </head>
      `);
    });

    it('returns a function that cleans up inserted link tags', () => {
      const cleanup = strategy();

      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });
});

describe('createWebpackPreloadStrategy', () => {
  it('throws an unsupported error when webpack is not defined', () => {
    expect(() =>
      createWebpackPreloadStrategy({
        loader: jest.fn(),
        rel: 'prefetch',
      })
    ).toThrow('Unsupported preload strategy');
  });

  it('returns the strategy when webpack is defined', () => {
    defineWebpack();

    const loader = jest.fn();
    const strategy = createWebpackPreloadStrategy({
      loader,
      rel: 'preload',
    });

    expect(loader).not.toHaveBeenCalled();
    expect(strategy).toEqual(expect.any(Function));
  });

  describe('strategy', () => {
    let loader: jest.Mock;
    let strategy: PreloadStrategy;

    beforeEach(() => {
      defineWebpack();

      loader = jest.fn(() =>
        Promise.all([
          (window as any).__webpack_require__.e('async-webpack-strategy-1'),
          (window as any).__webpack_require__.e('async-webpack-strategy-2'),
        ])
      );

      strategy = createWebpackPreloadStrategy({
        loader,
        rel: 'preload',
      });
    });

    it('inserts the link tags for the asset', () => {
      strategy();

      expect(loader).toHaveBeenCalled();
      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/async-webpack-strategy-1.js"
            rel="preload"
          />
          <link
            href="/async-webpack-strategy-2.js"
            rel="preload"
          />
        </head>
      `);
    });

    it('returns a function that cleans up inserted link tags', () => {
      const cleanup = strategy();

      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });
});

describe('preloadAsset', () => {
  const webpackLoader = () =>
    Promise.all([
      (window as any).__webpack_require__.e('async-webpack-strategy-1'),
      (window as any).__webpack_require__.e('async-webpack-strategy-2'),
    ]);

  const moduleId = '@foo/bar';

  describe('when all strategies are available', () => {
    beforeEach(() => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {
            [moduleId]: [
              'async-manifest-strategy-1.js',
              'async-manifest-strategy-2.js',
            ],
          },
        },
      });

      defineWebpack();
    });

    it('preloads the assets through the manifest strategy', () => {
      preloadAsset({
        loader: webpackLoader,
        moduleId,
        priority: PRIORITY.HIGH,
      });

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/async-manifest-strategy-1.js"
            rel="preload"
          />
          <link
            href="/async-manifest-strategy-2.js"
            rel="preload"
          />
        </head>
      `);
    });

    it('returns a function that cleans up inserted link tags', () => {
      preloadAsset({
        loader: webpackLoader,
        moduleId,
        priority: PRIORITY.HIGH,
      })();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });

  describe('when the manifest strategy is not available', () => {
    beforeEach(() => {
      defineWebpack();
    });

    it('preloads the assets through the webpack strategy', () => {
      preloadAsset({
        loader: webpackLoader,
        moduleId,
        priority: PRIORITY.HIGH,
      });

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/async-webpack-strategy-1.js"
            rel="preload"
          />
          <link
            href="/async-webpack-strategy-2.js"
            rel="preload"
          />
        </head>
      `);
    });

    it('returns a function that cleans up inserted link tags', () => {
      preloadAsset({
        loader: webpackLoader,
        moduleId,
        priority: PRIORITY.HIGH,
      })();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });

  describe('when the webpack strategy is not available', () => {
    beforeEach(() => {
      LooselyLazy.init({
        manifest: {
          publicPath: '/',
          assets: {
            [moduleId]: [
              'async-manifest-strategy-1.js',
              'async-manifest-strategy-2.js',
            ],
          },
        },
      });
    });

    it('preloads the assets through the manifest strategy', () => {
      preloadAsset({
        loader: jest.fn(),
        moduleId,
        priority: PRIORITY.HIGH,
      });

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/async-manifest-strategy-1.js"
            rel="preload"
          />
          <link
            href="/async-manifest-strategy-2.js"
            rel="preload"
          />
        </head>
      `);
    });

    it('returns a function that cleans up inserted link tags', () => {
      preloadAsset({
        loader: jest.fn(),
        moduleId,
        priority: PRIORITY.HIGH,
      })();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });

  describe('when the manifest and webpack strategy are not available', () => {
    it('preloads the assets through the loader strategy', () => {
      const loader = jest.fn();

      preloadAsset({
        loader,
        moduleId,
        priority: PRIORITY.HIGH,
      });

      expect(loader).toHaveBeenCalled();
    });

    it('returns a cleanup function that does nothing', () => {
      const cleanup = preloadAsset({
        loader: jest.fn(),
        moduleId,
        priority: PRIORITY.HIGH,
      });

      expect(cleanup).not.toThrow();
    });
  });
});
