# `<LazyWait />`

This component conditionally renders its children in a declarative way, and should generally only be used when there is a need to preserve CSS animations between the [`LazySuspense`](api/lazy-suspense) fallback and the [`LazyComponent`](api/lazy-component).

## Props
### `children`
`ReactNode`

The children to be rendered, which should include a [`LazySuspense`](api/lazy-suspense) and [`LazyComponent`](api/lazy-component) component

---

### `until`
`boolean`

The condition that needs to be fulfilled to render the `children`
