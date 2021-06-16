import React from 'react';

export type FooProps = {
  foo: string;
};

export const Foo = ({ foo }: FooProps) => <div>{foo}</div>;

export default Foo;
