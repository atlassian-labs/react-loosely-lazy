// @flow strict

import React, { type ComponentType } from 'react';

export type FooProps = {
  foo: string,
};

export const Foo: ComponentType<FooProps> = ({ foo }: FooProps) => (
  <div>{foo}</div>
);

export default Foo;
