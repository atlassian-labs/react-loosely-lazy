# Introduction
`react-loosely-lazy` is a future focused async component loading library for React. It comes packed with loading phases to enable fine-grained performance optimisations.

## Motivation
Today, React's native solution for asynchronously loading components, [`React.lazy`](https://reactjs.org/docs/code-splitting.html#reactlazy), does not work on the server. To get around this, developers have had to invent their own solutions to the problem such as `react-loadable` and `loadable-components`. These libraries however will not be compatible with `Suspense` out of the box and their APIs are quite different to the direction the React team are taking. It's also clear that this has become such a core part of building React apps at scale that it makes sense to rely on React to fill this requirement rather than third party libraries.

In addition to this we have to consider that, certainly from a performance point of view, not all components are created equal. It does not make sense to load components which are **required** for your user's first meaningful paint at the same time as those which are not. Doing so will impact your user's experience negatively. Likewise it is best to be able to opt-out of SSR for a component if you know that this will delay response times from the server significantly or if the component will not be able to be rendered in your Node environment.

`react-loosely-lazy` solves both of these problems with a server side compatible API that looks just like `Suspense`, while also providing an opt-in, phase based loading mechanism.

## Features
* Same code on the server and client, handling SSR transparently
* Loading priority support via phases
* Customisable deferred loading and phases definition
* Preload and prefetch support
* Named import support
* Works with both `React.render()` and `React.hydrate()`
* Webpack plugin to generate a manifest, used to load assets ahead of time on the server
