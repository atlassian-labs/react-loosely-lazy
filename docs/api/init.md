# `init(options)`
This function configures the library with global options, and also collects any server markup on the client that is later rendered when the [`LazyComponent`](api/lazy-component) is still loading.

It should be called as early as possible, before React renders or hydrates the application. 

## Example
```jsx
import { render } from 'react-dom';
import LooselyLazy, { MODE } from 'react-loosely-lazy';
import { App } from './app';
import manifest from './lazy-manifest.json';

LooselyLazy.init({
  crossOrigin: 'anonymous',
  manifest,
  mode: MODE.RENDER,
});

render(<App />, document.getElementById('root'));
```

## Options
### `crossOrigin?`
`typeof SETTINGS.CROSS_ORIGIN: 'anonymous'` | `'use-credentials'` | `undefined`

This option sets the cross-origin value used for preloading and prefetching components.

It should be the same value as `webpack output.crossOriginLoading`, otherwise the link tags will not function correctly, and the resources will be requested twice.

---

### `manifest?`
`Manifest`

The webpack manifest generated from the [`react-loosely-lazy/webpack-plugin`](tooling/webpack-plugin).

When provided, preload and prefetch links can be generated in the [`Document#head`](https://developer.mozilla.org/en-US/docs/Web/API/Document/head) on the server by calling [`LazyComponent#getAssetUrls`](api/lazy-component?id=getasseturls).

The manifest is also used to output preload and prefetch links when rendering the lazy component on the server. This typically occurs in the [`Document#body`](https://developer.mozilla.org/en-US/docs/Web/API/Document/body), and facilitates conditional loading of bundles on initial page loads.

> **Note**
> 
> The manifest can be provided on the client, though it is not necessary

---

### `mode?`
`keyof typeof MODE: 'RENDER' | 'HYDRATE'`

Specifies whether the library should run in render or hydrate mode, and should be set to the same value between the client and server

<div class="alert--tip">

> **Tip**
>
> If your application does not support hydration, then use the `RENDER` mode

</div>

### `retry?`
`number = 2`

Configures the amount of times to retry the [`loader`](api/lazy?id=loader), when it returns a rejected promise.

**Table 1:** Effects of the retry option

| Value | Behaviour               |
| ----- | ----------------------- |
| -1    | Retry indefinitely      |
| 0     | Do not retry on failure |
| 1...n | Retry n times           |
