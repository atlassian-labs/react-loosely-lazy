# Core concepts
## Background
Building a performant application involves efficiently managing the delivery, priority, and size of resources requested on a page, including: JavaScript, CSS, fonts, images, videos, data, etc. If we want to create a blazing fast application, then we must consider the optimal strategy for handling resources in the frontend without sacrificing the user-experience:

* **Delivery, and size:** Only the resources that are needed should be delivered
* **Priority:** The resources that are delivered should be available *just* before we need to use them

In many single-page applications, [code-splitting](https://reactjs.org/docs/code-splitting.html) is the primary way to optimise the delivery and size of resources. This feature splits code into various bundles, enabling the split modules to be loaded in parallel when requested. Assets defined in an entrypoint are downloaded as early as possible, while all remaining assets load on demand. Effectively this reduces the amount of code initially downloaded, improving page load performance, and helps prevent loading code that is never needed by the user.

While bundlers like [webpack](https://webpack.js.org/guides/code-splitting/) support resource load prioritisation by embedding resource hints within a comment, they do have their limitations. For instance, given a route definition list in an entry chunk like the following:

```javascript
export const routes = [
  {
    path: '/foo',
    component: () => import(/* webpackPreload: true */ './foo')
  },
  {
    path: '/bar',
    component: () => import(/* webpackPrefetch: true */ './bar')
  }
];
```

The `Bar` route component will be prefetched on load, regardless of whether the route is matched for a particular request or not. Additionally, there is no API in React, webpack, or other bundlers to prioritise loading a resource when it is conditionally rendered:

```jsx
import { Suspense, lazy, useState } from 'react';

const ConditionalComponent = lazy(() => import('./conditional-component'));

export const App = () => {
  const [
    showConditionalComponent,
    setShowConditionalComponent
  ] = useState(false);
  
  const onClick = () => {
    // ConditionalComponent.preload(), or similar, does not exist...
    setShowConditionalComponent(true);
  };
  
  return (
    <>
      <button onClick={onClick}>
        Load
      </button>

      {showConditionalComponent && (
        <Suspense fallback="Loading...">
          <ConditionalComponent />
        </Suspense>
      )}
    </>
  );
};
```

`react-loosely-lazy` aims to bridge this gap by providing three explicit loading priorities to lazy load components, known as *loading phases*, that in turn impact the delivery and size of the imported assets. The declarative and statically analysable API we have designed seamlessly handles server-side rendering, facilitating greater control over the delivery and size of the document; is capable of smartly preloading code automatically; and exposes a way to manually preload components for granular control over resource load priority.

## Loading phases
There are three explicit loading phases: *paint*, *after paint*, and *lazy*; that are preceded by an implicit *initial* phase. Each phase will occur one after the other, in the following order from left to right:

<div class="phases">
    <div class="phase">
        <span class="phase__step">0</span>
        <span class="phase__name">initial</span>
    </div>
    <div class="phase">
        <span class="phase__step">1</span>
        <span class="phase__name">paint</span>
    </div>
    <div class="phase">
        <span class="phase__step">2</span>
        <span class="phase__name">after paint</span>
    </div>
    <div class="phase">
        <span class="phase__step">3</span>
        <span class="phase__name">lazy</span>
    </div>
</div>

By separating code into distinct phases, we are able to improve perceived performance and prioritise which features on a page should load first. For instance, given a page layout with a top navigation, sidebar, and content where each section is loaded asynchronously. Without assigning any priorities, the top navigation will usually become interactive first as it is rendered before the other components, and should have the smallest bundle size. Then the sidebar, followed by the content will load using the same logic. When using loading phases, we can instead ensure that the content loads earlier than the sidebar so that the [first contentful paint](https://developer.mozilla.org/en-US/docs/Glossary/First_contentful_paint) is associated with the main content, rather than the sidebar. This difference in behaviour can be seen below: 

<div class="phase-comparisons">
    <style>
        .phase-comparison svg, .phase-comparison svg * {
            filter: contrast(0.75);
        }
        .phase-comparison svg rect {
            rx: 1px;
        }
        .phase-comparison__borders {
            fill: rgba(255, 255, 255, 1);
            stroke: rgba(255, 255, 255, 1);
            stroke-width: 2px;
        }
        .phase-comparison__navigation-skeletons,
        .phase-comparison__sidebar-skeletons {
            fill: rgba(255, 255, 255, 0.6);
        }
        .phase-comparison__content-skeletons {
            fill: rgba(255, 255, 255, 0.3);
        }
        @keyframes none-navigation {
            0%, 30% { opacity: 1; }
            35%, 100% { opacity: 0; }
        }
        @keyframes none-sidebar {
            0%, 50% { opacity: 1; }
            55%, 100% { opacity: 0; }
        }
        @keyframes none-content {
            0%, 70% { opacity: 1; }
            75%, 100% { opacity: 0; }
        }
        .phase-comparison__none .phase-comparison__navigation-skeletons {
            animation: none-navigation 10s infinite;
        }
        .phase-comparison__none .phase-comparison__sidebar-skeletons {
            animation: none-sidebar 10s infinite;
        }
        .phase-comparison__none .phase-comparison__content-skeletons {
            animation: none-content 10s infinite;
        }
        @keyframes phases-navigation {
            0%, 30% { opacity: 1; }
            35%, 100% { opacity: 0; }
        }
        @keyframes phases-sidebar {
            0%, 70% { opacity: 1; }
            75%, 100% { opacity: 0; }
        }
        @keyframes phases-content {
            0%, 50% { opacity: 1; }
            55%, 100% { opacity: 0; }
        }
        .phase-comparison__phases .phase-comparison__navigation-skeletons {
            animation: phases-navigation 10s infinite;
        }
        .phase-comparison__phases .phase-comparison__sidebar-skeletons {
            animation: phases-sidebar 10s infinite;
        }
        .phase-comparison__phases .phase-comparison__content-skeletons {
            animation: phases-content 10s infinite;
        }
    </style>
    <div class="phase-comparison">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 112" class="phase-comparison__none">
            <rect x="0" y="10" width="50" height="112" class="phase-comparison__sidebar" fill="none"/>
            <rect x="0" y="0" width="200" height="10" class="phase-comparison__navigation" fill="none"/>
            <g class="phase-comparison__borders">
                <rect x="0" y="0" width="200" height="112" fill="none"/>
                <rect x="50" y="12" width="0.5" height="112" stroke="none"/>
                <rect x="0" y="12" width="200" height="0.5" stroke="none"/>
            </g>
            <g class="phase-comparison__navigation-skeletons">
                <circle cx="178" cy="6" r="3"/>
                <circle cx="186" cy="6" r="3"/>
                <circle cx="194" cy="6" r="3"/>
            </g>
            <g class="phase-comparison__sidebar-skeletons">
                <rect x="5" y="20" width="35" height="2"/>
                <rect x="5" y="30" width="20" height="2"/>
                <rect x="5" y="40" width="25" height="2"/>
                <rect x="5" y="50" width="30" height="2"/>
                <rect x="5" y="60" width="15" height="2"/>
                <rect x="5" y="70" width="20" height="2"/>
            </g>
            <g class="phase-comparison__content-skeletons">
                <rect x="55" y="19" width="60" height="8"/>
                <rect x="55" y="30" width="110" height="25"/>
                <rect x="55" y="60" width="100" height="20"/>
                <rect x="55" y="85" width="105" height="7"/>
            </g>
        </svg>
        <em>without loading phases</em>
    </div>
    <div class="phase-comparison">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 112" class="phase-comparison__phases">
            <rect x="0" y="10" width="50" height="112" class="phase-comparison__sidebar" fill="none"/>
            <rect x="0" y="0" width="200" height="10" class="phase-comparison__navigation" fill="none"/>
            <g class="phase-comparison__borders">
                <rect x="0" y="0" width="200" height="112" fill="none"/>
                <rect x="50" y="12" width="0.5" height="112" stroke="none"/>
                <rect x="0" y="12" width="200" height="0.5" stroke="none"/>
            </g>
            <g class="phase-comparison__navigation-skeletons">
                <circle cx="178" cy="6" r="3"/>
                <circle cx="186" cy="6" r="3"/>
                <circle cx="194" cy="6" r="3"/>
            </g>
            <g class="phase-comparison__sidebar-skeletons">
                <rect x="5" y="20" width="35" height="2"/>
                <rect x="5" y="30" width="20" height="2"/>
                <rect x="5" y="40" width="25" height="2"/>
                <rect x="5" y="50" width="30" height="2"/>
                <rect x="5" y="60" width="15" height="2"/>
                <rect x="5" y="70" width="20" height="2"/>
            </g>
            <g class="phase-comparison__content-skeletons">
                <rect x="55" y="19" width="60" height="8"/>
                <rect x="55" y="30" width="110" height="25"/>
                <rect x="55" y="60" width="100" height="20"/>
                <rect x="55" y="85" width="105" height="7"/>
            </g>
        </svg>
        <em>with loading phases</em>
    </div>
</div>

Splitting existing features on a page into different stages will also reduce the amount of code that needs to download in each phase. What used to be a 300 KB page, can now become 200 KB in the paint phase, 85 KB in the after paint phase, and 15 KB in the lazy phase. Creating these additional code-split points will further improve first paint times of primary features.

### Initial
The initial phase directly corresponds to the [first paint](https://developer.mozilla.org/en-US/docs/Glossary/First_paint), and should be used to display the initial page layout via loading states such as spinners, skeletons, etc. It generally refers to any code loaded through a synchronous import, like in the following example:

```jsx
import { LazySuspense } from 'react-loosely-lazy';
import { Foo } from './foo';
import { Skeleton } from './skeleton';

export const App = () => (
  <>
    <Foo />
    <LazySuspense fallback={<Skeleton />}>
      {/* ... */}
    </LazySuspense>
  </>
);
```

However, it is also important to consider [server-side rendering](guides/server-side-rendering) as a part of the initial phase, because it impacts the time to first paint on initial page loads. The [`ssr`](api/lazy?id=ssr) option should be overridden in cases where a component will delay the overall server processing times. Otherwise, this phase must be kept lightweight to maintain good performance characteristics, which may involve optimising the:

* HTML document payload size and delivery, particularly when server-side rendering
* Entry bundles, including code from the application itself and third-party dependencies
* React components (component depth, runtime and render cost, etc)

### Paint
The paint phase is designed for components rendered on the critical path, and should map to the [first meaningful paint](https://developer.mozilla.org/en-US/docs/Glossary/first_meaningful_paint). Components defined in this phase via [`lazyForPaint`](api/lazy) will be:

* Rendered on the server by default 
* Loaded and made interactive as soon as possible, when rendered on the client

This phase works out of the box, as shown below:

```jsx
import { LazySuspense, lazyForPaint } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazyForPaint(() => import('./foo'));

const App = () => (
  <LazySuspense fallback={<Skeleton />}>
    <Foo />
  </LazySuspense>
);
```

### After paint
The after paint phase is a secondary phase that loads once it has been triggered by the consumer, through the [`useLazyPhase`](api/use-lazy-phase) API. Components loaded through [`lazyAfterPaint`](api/lazy) typically become interactive after the initial paint phase components have rendered. Therefore, this phase is not necessarily tied to the first meaningful paint, and should be reserved for components that: 

1. Take a long time to load, that would otherwise block the critical path; or
2. Are considered less important than other features on the page, so that paint phase components can become interactive sooner

Next, we can see how this phase can be used:

```jsx
import { LazySuspense, lazyAfterPaint, useLazyPhase } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazyAfterPaint(() => import('./foo'));

const App = () => {
  const { startNextPhase } = useLazyPhase();
  // e.g. start loading Foo after the app has mounted
  useEffect(() => {
    startNextPhase();
  }, [startNextPhase]);

  return (
    <LazySuspense fallback={<Skeleton />}>
      <Foo />
    </LazySuspense>
  );
};
```

### Lazy
The lazy phase is the final phase, loading in shortly after the *after paint* phase. It is also the only phase that does not render on the server by default. Components declared using [`lazy`](api/lazy) should be reserved for features that become visible through a user interaction (e.g. dropdowns, modals, drawers, etc):

```jsx
import { useState } from 'react';
import { LazySuspense, lazy } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazy(() => import('./foo'));

const App = () => {
  const [shouldLoad, setShouldLoad] = useState(false);

  return (
    <>
      <button onClick={() => setShouldLoad(true)}>Load</button>

      {shouldLoad && (
        <LazySuspense fallback={<Skeleton />}>
          <Foo />
        </LazySuspense>
      )}
    </>
  );
};
```

## References
* 📄 [Rebuilding our tech stack for the new facebook.com](https://engineering.fb.com/2020/05/08/web/facebook-redesign)
* 📄 [Code splitting (webpack)](https://webpack.js.org/guides/code-splitting)
* 📄 [Priority hints](https://developers.google.com/web/updates/2019/02/priority-hints)