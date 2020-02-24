<h1 align="center">react-loosely-lazy</h1>

[![npm](https://img.shields.io/npm/v/react-loosely-lazy.svg)](https://www.npmjs.com/package/react-loosely-lazy)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/react-loosely-lazy.svg)](https://bundlephobia.com/result?p=react-loosely-lazy)
[![License](https://img.shields.io/:license-MIT-blue.svg)](./LICENSE)
[![CircleCI](https://circleci.com/gh/atlassian/react-loosely-lazy.svg?style=shield&circle-token=xxx)](https://circleci.com/gh/atlassian/react-loosely-lazy)
[![codecov](https://codecov.io/gh/atlassian/react-loosely-lazy/branch/master/graph/badge.svg)](https://codecov.io/gh/atlassian/react-loosely-lazy)

The future of React async components, today.

- Same code on server and client, handling SSR transparently
- Priority support, allowing per-phase loading
- Customisable deferred loading and phases definition
- Preloading support
- Works with both React.render() and React.hydrate()

## Basic usage

```sh
npm i react-loosely-lazy
# or
yarn add react-loosely-lazy
```

#### Creating a Subscriber

```js
// async.js
import { lazy } from 'react-loosely-lazy';
```

```js
// app.js
import { AsyncButton } from './components/async';

const CounterApp = () => {};
```

## Documentation

[Check the docs website](https://atlassian.github.io/react-loosely-lazy/)  
[or the docs folder](docs/README.md).

## Examples

See loosely-lazy in action: run `npm run start` and then go and check: `http://localhost:8080/`

## Contributing

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.
