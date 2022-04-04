import React from 'react';

import { createSuspendableData } from '../../utils';
import { Result } from '../common/result';

const useSuspendableData = createSuspendableData();

const ComponentWithSSR = () => {
  useSuspendableData();

  return <Result />;
};
export default ComponentWithSSR;
