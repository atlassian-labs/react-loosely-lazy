# `useLazyPhase()`
This hook provides consumers with a means of controlling when the different loading phases are triggered.

<div class="alert--warning">

> **Warning**
> 
> This hook should not be used when [`autoStart`](api/init?id=autostart) is enabled, and will be removed once automatically managed phases becomes the default behaviour in the next major release

</div>

## Example
```jsx
import { useLazyPhase } from 'react-loosely-lazy';
import { usePageReady } from './use-page-ready';

const PageLoadedListener = () => {
  const { resetPhase, startNextPhase } = useLazyPhase();
  const isReady = usePageReady();

  useEffect(() => {
    if (isReady) {
      startNextPhase();
    } else {
      resetPhase();
    }
  }, [isReady, startNextPhase]);
  
  return null;
};
```

## Return value
### `startNextPhase()`
Calling this will set the current phase to _after paint_. Any `lazyAfterPaint` components that have already been rendered will now start loading, followed by the `lazy` components.

By starting the next phase, all types of lazy components will now load as soon as they are rendered.

---

### `resetPhase()`
Resets the current loading phase to _paint_. If a `lazyAfterPaint` or `lazy` component is rendered afterwards, it will not load the dynamic import and thus its contents, until `startNextPhase` is called.

<div class="alert--tip">

> **Tip**
> 
> When working in a single page application, it is recommended that `resetPhase` is called on each page transition

</div>
