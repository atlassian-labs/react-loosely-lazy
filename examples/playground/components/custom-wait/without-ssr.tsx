import React from 'react';

import { controlFetch } from '../../utils';
import { Result } from '../result';

let hasThrown = false;

const ComponentWithoutSSR = () => {
  if (!hasThrown && window.name !== 'nodejs') {
    hasThrown = true;
    throw controlFetch(true);
  }

  return <Result step="CUSTOM" isDone />;
};
export default ComponentWithoutSSR;
