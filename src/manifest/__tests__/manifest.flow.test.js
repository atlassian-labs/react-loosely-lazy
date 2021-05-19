// @flow strict

import { getAssetUrlsFromId, type Manifest } from 'react-loosely-lazy/manifest';

// $FlowExpectedError[incompatible-exact] Missing publicPath and assets
const missingKeysManifest: Manifest = {};

// $FlowExpectedError[prop-missing] Missing publicPath
const missingPublicPathManifest: Manifest = {
  assets: {},
};

// $FlowExpectedError[prop-missing] Missing assets
const missingAssetsManifest: Manifest = {
  publicPath: '',
};

const incompatiblePublicPathManifest: Manifest = {
  // $FlowExpectedError[incompatible-type] string is not compatible with boolean
  publicPath: true,
  assets: {},
};

const incompatibleAssetsManifest: Manifest = {
  publicPath: '',
  // $FlowExpectedError[incompatible-type] assets is not compatible with boolean
  assets: true,
};

const incompatibleAssetManifest: Manifest = {
  publicPath: '',
  assets: {
    // $FlowExpectedError[incompatible-type] Asset is not compatible with boolean
    foo: true,
    // $FlowExpectedError[incompatible-type] Asset is not compatible with {}
    bar: {},
    // $FlowExpectedError[incompatible-type] Asset is not compatible with [boolean]
    baz: [true],
    qux: [''],
  },
};

const manifest: Manifest = {
  publicPath: '',
  assets: {},
};

// $FlowExpectedError[incompatible-call] Missing arguments
getAssetUrlsFromId();

// $FlowExpectedError[incompatible-call] Missing argument
getAssetUrlsFromId(manifest);

// $FlowExpectedError[incompatible-call] Manifest is incompatible with boolean
getAssetUrlsFromId(true, '');

// $FlowExpectedError[prop-missing] Missing properties in Manifest
getAssetUrlsFromId({}, '');

// $FlowExpectedError[incompatible-call] string is incompatible with boolean
getAssetUrlsFromId(manifest, true);

getAssetUrlsFromId(manifest, '');
