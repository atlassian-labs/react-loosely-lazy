import React from 'react';

import { controlFetch } from '../../utils';
import { Result } from '../result';

let hasThrown = false;

const ComponentWithSSR = () => {
  if (!hasThrown && window.name !== 'nodejs') {
    hasThrown = true;
    throw controlFetch(true);
  }

  return <Result step="PAINT" hasSsr isDone />;
};
export default ComponentWithSSR;
