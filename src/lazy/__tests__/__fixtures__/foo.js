// @flow strict

import React, { type ComponentType } from 'react';

export type FooProps = {
  foo: string,
};

export const Foo: ComponentType<FooProps> = ({ foo }) => <div>{foo}</div>;

export default Foo;
