// @flow strict

import React from 'react';

export type BarProps = {
  bar: string,
};

export const Bar = ({ bar }: BarProps) => <div>{bar}</div>;

export default Bar;
