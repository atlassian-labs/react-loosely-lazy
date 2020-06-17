import React from 'react';
import { lazyForPaint } from 'react-loosely-lazy';
import type { FooProps } from './__fixtures__/foo';

const UntypedEmptyPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/empty-props')
);

<UntypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<UntypedEmptyPropsTestComponent foo="foo" />;

// eslint-disable-next-line @typescript-eslint/ban-types
const TypedEmptyPropsTestComponent = lazyForPaint<{}>(() =>
  import('./__fixtures__/empty-props')
);

<TypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<TypedEmptyPropsTestComponent foo="foo" />;

const NamedUntypedEmptyPropsTestComponent = lazyForPaint<unknown>(() =>
  import('./__fixtures__/empty-props').then(({ EmptyProps }) => EmptyProps)
);

<NamedUntypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<NamedUntypedEmptyPropsTestComponent foo="foo" />;

// eslint-disable-next-line @typescript-eslint/ban-types
const NamedTypedEmptyPropsTestComponent = lazyForPaint<{}>(() =>
  import('./__fixtures__/empty-props').then(({ EmptyProps }) => EmptyProps)
);

<NamedTypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<NamedTypedEmptyPropsTestComponent foo="foo" />;

const UntypedPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/foo')
);

// @ts-expect-error foo prop is missing
<UntypedPropsTestComponent />;

<UntypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<UntypedPropsTestComponent foo="foo" bar="bar" />;

const TypedPropsTestComponent = lazyForPaint<FooProps>(() =>
  import('./__fixtures__/foo')
);

// @ts-expect-error foo prop is missing
<TypedPropsTestComponent />;

<TypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<TypedPropsTestComponent foo="foo" bar="bar" />;

const NamedUntypedPropsTestComponent = lazyForPaint(() =>
  // @ts-expect-error TypeScript does not seem to infer named imports correctly, refer to: https://github.com/microsoft/TypeScript/issues/30712
  import('./__fixtures__/foo').then(({ Foo }) => Foo)
);

<NamedUntypedPropsTestComponent />;

// @ts-expect-error foo prop cannot be inferred
<NamedUntypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<NamedUntypedPropsTestComponent foo="foo" bar="bar" />;

const NamedTypedPropsTestComponent = lazyForPaint<FooProps>(() =>
  import('./__fixtures__/foo').then(({ Foo }) => Foo)
);

// @ts-expect-error foo prop is missing
<NamedTypedPropsTestComponent />;

<NamedTypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<NamedTypedPropsTestComponent foo="foo" bar="bar" />;

const MixedTypedPropsTestComponent = lazyForPaint<FooProps>(() =>
  // @ts-expect-error FooProps and BarProps do not match
  import('./__fixtures__/bar')
);

const NamedMixedTypedPropsTestComponent = lazyForPaint<FooProps>(() =>
  // @ts-expect-error FooProps and BarProps do not match
  import('./__fixtures__/bar').then(({ Bar }) => Bar)
);

const TestComponent = lazyForPaint<FooProps>(() =>
  import('./__fixtures__/foo')
);

// @ts-expect-error Missing manifest argument
TestComponent.getAssetUrls();

TestComponent.getAssetUrls({
  // @ts-expect-error Type '{}' is missing the following properties from type 'string[]'
  './src/app/foo.js': {},
});

TestComponent.getAssetUrls({
  './src/app/foo.js': ['https://cdn.com/async-foo.js'],
});
