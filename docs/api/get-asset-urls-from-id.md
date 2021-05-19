# `getAssetUrlsFromId(manifest, id)`
This function retrieves the list of assets urls given a manifest and the asset identifier

## Example
```jsx
import { getAssetUrlsFromId } from 'react-loosely-lazy/manifest';

const manifest = {
  publicPath: '/',
  assets: {
    './src/foo.js': ['1.js', '2.js'],
  },
}

getAssetUrlsFromId(manifest, './src/foo.js');
```

## Arguments
### `manifest`
`Manifest`

The manifest generated from [react-loosely-lazy/webpack plugin](tooling/webpack-plugin)

---

### `id`
`string`

The id of the asset, which is equivalent to [`lazy#moduleId`](api/lazy?id=moduleid) 

## Return value
`string[] | undefined`

Returns the list of asset paths when the `id` is found in the manifest, otherwise it returns `undefined`
