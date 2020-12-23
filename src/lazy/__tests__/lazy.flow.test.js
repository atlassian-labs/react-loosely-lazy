// @flow strict

import React, { type ComponentType } from 'react';
import { lazyForPaint } from 'react-loosely-lazy';
import type { FooProps } from './__fixtures__/foo';

const UntypedEmptyPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/empty-props')
);

<UntypedEmptyPropsTestComponent />;

<UntypedEmptyPropsTestComponent foo="foo" />;

const TypedEmptyPropsTestComponent = lazyForPaint<ComponentType<{}>>(() =>
  import('./__fixtures__/empty-props')
);

<TypedEmptyPropsTestComponent />;

// $FlowExpectedError foo prop is not allowed
<TypedEmptyPropsTestComponent foo="foo" />;

const NamedUntypedEmptyPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/empty-props').then(({ EmptyProps }) => EmptyProps)
);

<NamedUntypedEmptyPropsTestComponent />;

<NamedUntypedEmptyPropsTestComponent foo="foo" />;

const NamedTypedEmptyPropsTestComponent = lazyForPaint<ComponentType<{}>>(() =>
  import('./__fixtures__/empty-props').then(({ EmptyProps }) => EmptyProps)
);

<NamedTypedEmptyPropsTestComponent />;

// $FlowExpectedError foo prop is not allowed
<NamedTypedEmptyPropsTestComponent foo="foo" />;

const UntypedPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/foo')
);

// $FlowExpectedError foo prop is missing
<UntypedPropsTestComponent />;

<UntypedPropsTestComponent foo="foo" />;

// $FlowExpectedError bar prop is not allowed
<UntypedPropsTestComponent foo="foo" bar="bar" />;

const TypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  import('./__fixtures__/foo')
);

// $FlowExpectedError foo prop is missing
<TypedPropsTestComponent />;

<TypedPropsTestComponent foo="foo" />;

// $FlowExpectedError bar prop is not allowed
<TypedPropsTestComponent foo="foo" bar="bar" />;

const NamedUntypedPropsTestComponent = lazyForPaint(() =>
  import('./__fixtures__/foo').then(({ Foo }) => Foo)
);

// $FlowExpectedError foo prop is missing
<NamedUntypedPropsTestComponent />;

<NamedUntypedPropsTestComponent foo="foo" />;

// $FlowExpectedError bar prop is not allowed
<NamedUntypedPropsTestComponent foo="foo" bar="bar" />;

const NamedTypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  import('./__fixtures__/foo').then(({ Foo }) => Foo)
);

// $FlowExpectedError foo prop is missing
<NamedTypedPropsTestComponent />;

<NamedTypedPropsTestComponent foo="foo" />;

// $FlowExpectedError bar prop is not allowed
<NamedTypedPropsTestComponent foo="foo" bar="bar" />;

const MixedTypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  // $FlowExpectedError FooProps and BarProps do not match
  import('./__fixtures__/bar')
);

const NamedMixedTypedPropsTestComponent = lazyForPaint<ComponentType<FooProps>>(
  () =>
    // $FlowExpectedError FooProps and BarProps do not match
    import('./__fixtures__/bar').then(({ Bar }) => Bar)
);

const TestComponent = lazyForPaint<ComponentType<FooProps>>(() =>
  import('./__fixtures__/foo')
);

TestComponent.getAssetUrls();

TestComponent.preload();
