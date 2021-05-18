// @flow strict

import React, { type ComponentType } from 'react';

export type BarProps = {
  bar: string,
};

export const Bar: ComponentType<BarProps> = ({ bar }) => <div>{bar}</div>;

export default Bar;
