import LooselyLazy from '../../..';
import {
  preloadAssetViaLoader,
  preloadAssetViaManifest,
  preloadAssetViaWebpack,
} from '..';
import { insertLinkTag } from '../utils';

jest.mock('../utils');

describe('preload strategies', () => {
  describe('preloadAssetViaManifest', () => {
    afterEach(() => {
      LooselyLazy.init({ manifest: {} });
    });

    it('should add link tags and return true if module found', () => {
      const loader = jest.fn();
      LooselyLazy.init({ manifest: { '@foo/bar': ['/1.js'] } });

      const result = preloadAssetViaManifest(loader, {
        moduleId: '@foo/bar',
        rel: 'preload',
      });

      expect(insertLinkTag).toHaveBeenCalledWith('/1.js', 'preload');
      expect(result).toBe(true);
    });

    it('should return false if module not found', () => {
      const loader = jest.fn();
      LooselyLazy.init({ manifest: {} });

      const result = preloadAssetViaManifest(loader, {
        moduleId: '@foo/bar',
        rel: 'preload',
      });

      expect(insertLinkTag).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('preloadAssetViaWebpack', () => {
    afterEach(() => {
      delete (window as any).__webpack_require__;
      delete (window as any).__webpack_get_script_filename__;
    });

    it('should add link tags and return true if webpack env', () => {
      (window as any).__webpack_require__ = {
        e: () => Promise.reject(),
      };
      (window as any).__webpack_get_script_filename__ = (id: string) =>
        `/${id}.js`;

      const chunkId = 1;
      const loader = () => (window as any).__webpack_require__.e(chunkId);
      const result = preloadAssetViaWebpack(loader, {
        moduleId: '@foo/bar',
        rel: 'prefetch',
      });

      expect(insertLinkTag).toHaveBeenCalledWith('/1.js', 'prefetch');
      expect(result).toBe(true);
    });

    it('should return false if webpack not defined', () => {
      const loader = jest.fn();
      LooselyLazy.init({ manifest: {} });

      const result = preloadAssetViaWebpack(loader, {
        moduleId: '@foo/bar',
        rel: 'prefetch',
      });

      expect(insertLinkTag).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('preloadAssetViaLoader', () => {
    it('should call the loader and return true', () => {
      const loader = jest.fn();

      const result = preloadAssetViaLoader(loader);

      expect(insertLinkTag).not.toHaveBeenCalled();
      expect(loader).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
