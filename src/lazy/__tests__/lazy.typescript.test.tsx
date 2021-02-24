import React, { ComponentType } from 'react';
import { lazyForPaint, PRIORITY } from 'react-loosely-lazy';
import { FooProps } from './__fixtures__/foo';

const UntypedEmptyPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/empty-props')
);

<UntypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<UntypedEmptyPropsTestComponent foo="foo" />;

// eslint-disable-next-line @typescript-eslint/ban-types
const TypedEmptyPropsTestComponent = lazyForPaint<ComponentType<{}>>(() =>
  import('./__fixtures__/empty-props')
);

<TypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<TypedEmptyPropsTestComponent foo="foo" />;

const NamedUntypedEmptyPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/empty-props').then(({ EmptyProps }) => EmptyProps)
);

<NamedUntypedEmptyPropsTestComponent />;

// @ts-expect-error foo prop is not allowed
<NamedUntypedEmptyPropsTestComponent foo="foo" />;

// eslint-disable-next-line @typescript-eslint/ban-types
const NamedTypedEmptyPropsTestComponent = lazyForPaint<ComponentType<{}>>(() =>
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

const TypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  import('./__fixtures__/foo')
);

// @ts-expect-error foo prop is missing
<TypedPropsTestComponent />;

<TypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<TypedPropsTestComponent foo="foo" bar="bar" />;

const NamedUntypedPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/foo').then(({ Foo }) => Foo)
);

// @ts-expect-error foo prop is missing
<NamedUntypedPropsTestComponent />;

<NamedUntypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<NamedUntypedPropsTestComponent foo="foo" bar="bar" />;

const NamedTypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  import('./__fixtures__/foo').then(({ Foo }) => Foo)
);

// @ts-expect-error foo prop is missing
<NamedTypedPropsTestComponent />;

<NamedTypedPropsTestComponent foo="foo" />;

// @ts-expect-error bar prop is not allowed
<NamedTypedPropsTestComponent foo="foo" bar="bar" />;

const MixedTypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  // @ts-expect-error FooProps and BarProps do not match
  import('./__fixtures__/bar')
);

const NamedMixedTypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(
  () =>
    // @ts-expect-error FooProps and BarProps do not match
    import('./__fixtures__/bar').then(({ Bar }) => Bar)
);

const TestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  import('./__fixtures__/foo')
);

TestComponent.getAssetUrls();

TestComponent.preload();

TestComponent.preload(PRIORITY.HIGH);
