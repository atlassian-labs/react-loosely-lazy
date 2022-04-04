import React from 'react';

import { createSuspendableData } from '../../utils';
import { Result } from '../common/result';

const useSuspendableData = createSuspendableData();

const ComponentNoSSR = () => {
  useSuspendableData();

  return <Result />;
};

export default ComponentNoSSR;
