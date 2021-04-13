# `type LazyComponent`
## Definition
```typescript
LazyComponent<C>: FunctionComponent<ComponentProps<C>> & {
  preload: (...args) => void;
  getAssetUrls: () => string[] | undefined;
}
```

## Usages
* [`lazy*`](api/lazy)

## Methods
### `preload(...args)`
Preloads the lazy component given an optional priority, using the following loading strategies:

1. **Manifest**\
Inserts the appropriate `link` elements when the webpack manifest is provided in [`init`](api/init)

2. **Webpack**\
Requires the resource via webpack, when available, and inserts the appropriate `link` elements

3. **Loader**\
If none of the above strategies are available, the [`loader`](api/lazy?id=loader) will be called directly as the final fallback

#### Arguments
1. `priority?: PreloadPriority` Specifies the priority that should be used to retrieve the assets. When the priority is high, the assets will be preloaded, otherwise they are prefetched.

#### Example

```jsx
import { lazyForPaint } from 'react-loosely-lazy';
import { Link } from 'router';

const Foo = lazyForPaint(() => import('./foo'));

const App = () => {
  const onHover = () => {
    Foo.preload();
  };
  
  return (
    <header>
      <nav>
        <Link onHover={onHover} to="/foo">Foo</Link>
      </nav>
    </header>
  );
};
```

---

### `getAssetUrls()`
Retrieves the list of asset urls using the lazy component `moduleId` from the global manifest specified in [`init`](api/init) 

#### Return value
`string[] | undefined`

#### Example

Refer to the [server-side rendering](/guides/server-side-rendering?id=static-links) guide for how to use this method
