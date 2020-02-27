import React from 'react';

const ComponentNoSSR = () => (
  <div
    style={{ borderBottom: `2px solid #E1E` }}
  >{`<ComponentWaitNoSSR />`}</div>
);

export default ComponentNoSSR;
