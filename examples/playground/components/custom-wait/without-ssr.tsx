import React from 'react';

import { controlFetch } from '../../utils';
import { Result } from '../common/result';

let hasThrown = false;

const ComponentWithoutSSR = () => {
  if (!hasThrown) {
    hasThrown = true;
    throw controlFetch(true);
  }

  return <Result />;
};

export default ComponentWithoutSSR;
