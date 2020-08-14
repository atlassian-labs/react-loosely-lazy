import React from 'react';

import { isServer } from '../../utils';

type Props = {
  step: string;
  isFallback?: boolean;
  hasSsr?: boolean;
  isDone?: boolean;
};

export const Result = ({ isFallback, hasSsr }: Props) => {
  return (
    <div style={{ background: hasSsr && isFallback ? '#E11' : '' }}>
      <h4>{hasSsr ? 'With ssr' : 'Without ssr'}</h4>
      <ul style={{ display: 'flex', margin: 0 }}>
        <li style={{ paddingRight: '1em' }}>
          reactive: {isServer() ? '🅾️' : '✅'}
        </li>
        <li style={{ paddingRight: '1em' }}>
          content: {isFallback ? '🅾️' : isServer() ? '☑️' : '✅'}
        </li>
      </ul>
    </div>
  );
};
