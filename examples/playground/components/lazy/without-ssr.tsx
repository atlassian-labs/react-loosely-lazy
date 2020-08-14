import React from 'react';
import { controlFetch } from '../../utils';
import { Result } from '../common/result';

let hasThrown = false;

const ComponentWithSSR = () => {
  if (!hasThrown) {
    hasThrown = true;
    throw controlFetch(true);
  }

  return <Result step="AF" isDone />;
};
export default ComponentWithSSR;
