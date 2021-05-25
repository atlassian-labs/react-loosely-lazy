import { getAssetUrlsFromId } from '../src';

describe('getAssetUrlsFromId', () => {
  it('should return undefined when the id does not exist in the manifest', () => {
    const manifest = {
      publicPath: '/output/',
      assets: {},
    };

    expect(getAssetUrlsFromId(manifest, 'foo')).toBeUndefined();
  });

  it('should return an empty list when there are no corresponding assets for the id', () => {
    const manifest = {
      publicPath: '/output/',
      assets: {
        foo: [],
      },
    };

    expect(getAssetUrlsFromId(manifest, 'foo')).toEqual([]);
  });

  it('should return the corresponding list of assets for the id', () => {
    const manifest = {
      publicPath: '/output/',
      assets: {
        foo: ['async-bar.js', 'async-baz.js'],
      },
    };

    expect(getAssetUrlsFromId(manifest, 'foo')).toEqual([
      '/output/async-bar.js',
      '/output/async-baz.js',
    ]);
  });
});
