# Webpack plugin
The `ReactLooselyLazyPlugin` generates an output manifest file, containing a list of all of the lazy component asset paths, along with their corresponding asset dependencies.

This plugin should be used with the [`react-loosely-lazy/babel-plugin`](tooling/babel-plugin), which ensures the output manifest can be operated on through the generated component `moduleId`.

## Applications
* Generate static preload and prefetch links ahead of time, such as in server-side rendering
* Dynamic preload and prefetch links, and client-side preloading, when used with the [`init`](api/init) option

## Installation
```sh
# npm
npm i react-loosely-lazy

# yarn
yarn add react-loosely-lazy
```

## Usage
```javascript
import { ReactLooselyLazyPlugin } from 'react-loosely-lazy/webpack-plugin';

export default {
  // ...
  plugins: [
    new ReactLooselyLazyPlugin({ filename: 'lazy-manifest.json' }),
  ],
};
```

## Options
### `filename`
`string`

Specifies the file name to use for the output manifest

---

### `publicPath`
`string = compilation.output.publicPath`

A path stored in the manifest, that is used to prefix asset paths in [`getAssetUrlsFromId`](api/get-asset-urls-from-id)
