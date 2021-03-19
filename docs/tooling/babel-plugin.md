# Babel plugin
The babel plugin is primarily designed to support server-side rendering, and should be used with the [webpack plugin](tooling/webpack-plugin) to handle preloading and prefetching.

## Features
* Generates a unique [`moduleId`](api/lazy?id=moduleId) for each lazy component
* Enables server rendering by transforming the [`loader`](api/lazy?id=loader) to a synchronous `require`
  * handles named imports by transforming `.then` 

## Installation
```sh
# npm
npm i react-loosely-lazy

# yarn
yarn add react-loosely-lazy
```

## Usage
### Configuration file

```javascript
// without options
{
  "plugins": ["react-loosely-lazy/babel-plugin"]
}

// with options
{
  "plugins": [
    ["react-loosely-lazy/babel-plugin", {
      "client": true
    }]
  ]
}
```

## Options
### `client?`
`boolean`

Specifies whether the plugin is operating on the client or the server

---

### `modulePathReplacer?`
`ModulePathReplacer: { from: string, to: string }`

The module path replacer transforms the output `moduleId`, by replacing any instances of `from` inside the original path with `to`

> **Note**
> 
> This option should be used when the plugin runs in different directories across the client and server

---

### `noopRedundantLoaders?`
`boolean = true`

This option is a performance optimisation that removes the dynamic import in `lazyForPaint`, `lazyAfterPaint`, and `lazy` components when the following conditions are fulfilled:
* The plugin is operating on the server (i.e. `client` is `false`)
* The component is not server enabled (i.e. `ssr: false`)
