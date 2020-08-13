import React, { useState, useEffect } from 'react';

import { listeners } from '../utils';

type Props = {
  step: string;
  isFallback?: boolean;
  hasSsr?: boolean;
  isDone?: boolean;
};

export const Result = ({ isFallback, hasSsr }: Props) => {
  const isServer = window.name === 'nodejs';

  return (
    <div style={{ background: hasSsr && isFallback ? '#E11' : '' }}>
      <h4>{hasSsr ? 'With ssr' : 'Without ssr'}</h4>
      <ul style={{ display: 'flex', margin: 0 }}>
        <li style={{ paddingRight: '1em' }}>
          reactive: {isServer ? '🅾️' : '✅'}
        </li>
        <li style={{ paddingRight: '1em' }}>
          content: {isFallback ? '🅾️' : isServer ? '☑️' : '✅'}
        </li>
      </ul>
    </div>
  );
};

export const Progress = ({ step }: { step: string }) => {
  const isServer = window.name === 'nodejs';
  const [waitType, setWaitType] = useState('hold');

  useEffect(() => {
    if ((window as any).step.includes(step)) {
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
      {isServer || waitType === 'hold'
        ? '❤️'
        : waitType === 'bundle'
        ? '🧡'
        : waitType
        ? '💛'
        : '💚'}
    </span>
  );
};
