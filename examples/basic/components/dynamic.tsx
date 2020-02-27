import React from 'react';

let hasThrown = false;

const ComponentDynamic = () => {
  if (!hasThrown) {
    hasThrown = true;
    throw new Promise(r => setTimeout(r, 1000));
  }

  return (
    <div style={{ borderBottom: `2px solid #E1E` }}>{`<ComponentNoSSR />`}</div>
  );
};

export default ComponentDynamic;
