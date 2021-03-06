import React from 'react';

import { controlFetch, isServer } from '../../utils';
import { Result } from '../common/result';

let hasThrown = false;

const ComponentWithSSR = () => {
  if (!hasThrown && !isServer()) {
    hasThrown = true;
    throw controlFetch(true);
  }

  return <Result hasSsr />;
};

export default ComponentWithSSR;
