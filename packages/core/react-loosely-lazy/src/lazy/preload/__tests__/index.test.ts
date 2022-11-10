import LooselyLazy, { PRIORITY } from '../../..';
import {
  preloadAsset,
  loaderPreloadStrategy,
  manifestPreloadStrategy,
  webpackPreloadStrategy,
} from '..';
import type { Cleanup } from '..';

jest.mock('../../../utils', () => ({
  ...jest.requireActual<any>('../../../utils'),
  isNodeEnvironment: () => false,
}));

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

const createManifest = (moduleId: string) => ({
  publicPath: '/',
  assets: {
    [moduleId]: [
      'async-manifest-strategy-1.js',
      'async-manifest-strategy-2.js',
    ],
  },
});

const defineWebpack = () => {
  (window as any).__webpack_require__ = {
    e: () => Promise.reject(),
  };
  (window as any).__webpack_get_script_filename__ = (id: string) => `/${id}.js`;
};

const moduleId = '@foo/bar';

describe('loaderPreloadStrategy', () => {
  it('calls the loader', () => {
    const loader = jest.fn();

    loaderPreloadStrategy({ loader });

    expect(loader).toHaveBeenCalled();
  });

  it('returns a cleanup function that does nothing', () => {
    const cleanup = loaderPreloadStrategy({ loader: jest.fn() });

    expect(cleanup).not.toThrow();
  });
});

describe('manifestPreloadStrategy', () => {
  it('throws an unsupported error when the manifest is not initialised', () => {
    expect(() =>
      manifestPreloadStrategy({
        moduleId,
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
      manifestPreloadStrategy({
        moduleId,
        rel: 'preload',
      })
    ).toThrow('Unsupported preload strategy');
  });

  describe('when the manifest is initialised with the loader module assets', () => {
    let cleanup: Cleanup;

    beforeEach(() => {
      LooselyLazy.init({
        manifest: createManifest(moduleId),
      });

      cleanup = manifestPreloadStrategy({
        moduleId,
        rel: 'preload',
      });
    });

    it('inserts the manifest module assets as link tags', () => {
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
      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });
});

describe('webpackPreloadStrategy', () => {
  it('throws an unsupported error when webpack is not defined', () => {
    expect(() =>
      webpackPreloadStrategy({
        loader: jest.fn(),
        rel: 'preload',
      })
    ).toThrow('Unsupported preload strategy');
  });

  describe('when webpack is defined', () => {
    let cleanup: Cleanup;
    let loader: jest.Mock;

    beforeEach(() => {
      defineWebpack();

      loader = jest.fn(() =>
        Promise.all([
          (window as any).__webpack_require__.e('async-webpack-strategy-1'),
          (window as any).__webpack_require__.e('async-webpack-strategy-2'),
        ])
      );

      cleanup = webpackPreloadStrategy({
        loader,
        rel: 'preload',
      });
    });

    it('inserts the link tags for the asset', () => {
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
      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });
});

describe('preloadAsset', () => {
  let cleanup: Cleanup;

  const webpackLoader = () =>
    Promise.all([
      (window as any).__webpack_require__.e('async-webpack-strategy-1'),
      (window as any).__webpack_require__.e('async-webpack-strategy-2'),
    ]);

  describe('when all strategies are available', () => {
    beforeEach(() => {
      LooselyLazy.init({
        manifest: createManifest(moduleId),
      });

      defineWebpack();

      cleanup = preloadAsset({
        loader: webpackLoader,
        moduleId,
        priority: PRIORITY.HIGH,
      });
    });

    it('preloads the assets through the manifest strategy', () => {
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
      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });

  describe('when the manifest strategy is not available', () => {
    beforeEach(() => {
      defineWebpack();

      cleanup = preloadAsset({
        loader: webpackLoader,
        moduleId,
        priority: PRIORITY.HIGH,
      });
    });

    it('preloads the assets through the webpack strategy', () => {
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
      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });

  describe('when the webpack strategy is not available', () => {
    beforeEach(() => {
      LooselyLazy.init({
        manifest: createManifest(moduleId),
      });

      cleanup = preloadAsset({
        loader: jest.fn(),
        moduleId,
        priority: PRIORITY.HIGH,
      });
    });

    it('preloads the assets through the manifest strategy', () => {
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
      cleanup();

      expect(document.head).toMatchInlineSnapshot(`<head />`);
    });
  });

  describe('when the manifest and webpack strategy are not available', () => {
    let loader: jest.Mock;

    beforeEach(() => {
      loader = jest.fn();

      cleanup = preloadAsset({
        loader,
        moduleId,
        priority: PRIORITY.HIGH,
      });
    });

    it('preloads the assets through the loader strategy', () => {
      expect(loader).toHaveBeenCalled();
    });

    it('returns a cleanup function that does nothing', () => {
      expect(cleanup).not.toThrow();
    });
  });
});
