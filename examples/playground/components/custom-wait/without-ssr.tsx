import React from 'react';

import { createSuspendableData } from '../../utils';
import { Result } from '../common/result';

const useSuspendableData = createSuspendableData();

const ComponentWithoutSSR = () => {
  useSuspendableData();

  return <Result />;
};

export default ComponentWithoutSSR;
