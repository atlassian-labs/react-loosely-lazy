import React, { useEffect, useState } from 'react';

import { isServer } from '../../utils';

type Props = {
  isFallback?: boolean;
  hasSsr?: boolean;
};

export const Result = ({ isFallback, hasSsr }: Props) => {
  const [isDone, setDone] = useState(isFallback);
  useEffect(() => {
    setDone(true);
  }, []);

  return (
    <div
      className="result"
      style={{ background: hasSsr && isFallback ? '#E11' : 'none' }}
    >
      <h4>{hasSsr ? 'With ssr' : 'Without ssr'}</h4>
      <ul style={{ display: 'flex', margin: 0 }}>
        <li style={{ paddingRight: '1em' }}>
          reactive:{' '}
          {isServer() || !isDone ? '🅾️' : isFallback || !isDone ? '☑️' : '✅'}
        </li>
        <li style={{ paddingRight: '1em' }}>
          content:{' '}
          {isFallback || !isDone ? '🅾️' : isServer() || !isDone ? '☑️' : '✅'}
        </li>
      </ul>
    </div>
  );
};
