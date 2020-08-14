import React, { useState, useEffect } from 'react';

import { pastSteps, listeners } from '../../constants';
import { isServer } from '../../utils';

type Props = {
  step: string;
};

export const Progress = ({ step }: Props) => {
  const [waitType, setWaitType] = useState('hold');

  useEffect(() => {
    if (pastSteps.has(step)) {
      setWaitType('bundle');
    }
  }, [step, setWaitType]);

  useEffect(() => {
    const listener = (v: string) => {
      if (!v.includes(step)) return;
      if (v.includes('LOADING')) setWaitType('bundle');
      else if (v.includes('FETCHING')) setWaitType('data');
      else setWaitType('');
    };
    if (waitType) listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, [step, waitType, setWaitType]);

  return (
    <span>
      {isServer() || waitType === 'hold'
        ? '❤️'
        : waitType === 'bundle'
        ? '🧡'
        : waitType
        ? '💛'
        : '💚'}
    </span>
  );
};
