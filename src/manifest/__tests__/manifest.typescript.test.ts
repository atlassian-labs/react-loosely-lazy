import { getAssetUrlsFromId } from 'react-loosely-lazy/manifest';
import type { Manifest } from 'react-loosely-lazy/manifest';

// @ts-expect-error Missing publicPath and assets
const missingKeysManifest: Manifest = {};

// @ts-expect-error Missing publicPath
const missingPublicPathManifest: Manifest = {
  assets: {},
};

// @ts-expect-error Missing assets
const missingAssetsManifest: Manifest = {
  publicPath: '',
};

const incompatiblePublicPathManifest: Manifest = {
  // @ts-expect-error string is not compatible with boolean
  publicPath: true,
  assets: {},
};

const incompatibleAssetsManifest: Manifest = {
  publicPath: '',
  // @ts-expect-error assets is not compatible with boolean
  assets: true,
};

const incompatibleAssetManifest: Manifest = {
  publicPath: '',
  assets: {
    // @ts-expect-error Asset is not compatible with boolean
    foo: true,
    // @ts-expect-error Asset is not compatible with {}
    bar: {},
    // @ts-expect-error Asset is not compatible with [boolean]
    baz: [true],
    qux: [''],
  },
};

const manifest: Manifest = {
  publicPath: '',
  assets: {},
};

// @ts-expect-error Missing arguments
getAssetUrlsFromId();

// @ts-expect-error Missing argument
getAssetUrlsFromId(manifest);

// @ts-expect-error Manifest is incompatible with boolean
getAssetUrlsFromId(true, '');

// @ts-expect-error Missing properties in Manifest
getAssetUrlsFromId({}, '');

// @ts-expect-error string is incompatible with boolean
getAssetUrlsFromId(manifest, true);

getAssetUrlsFromId(manifest, '');
