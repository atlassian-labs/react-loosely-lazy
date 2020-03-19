import React, { useEffect, useState } from 'react';

const ComponentWithSSR = () => {
  const [isInteractive, setInteractive] = useState(false);
  useEffect(() => {
    setInteractive(true);
  }, [setInteractive]);
  const color = isInteractive ? '#E1E' : '#DDD';

  return (
    <div style={{ borderBottom: `2px solid ${color}` }}>
      {`<ComponentWithSSR />`}
    </div>
  );
};

export default ComponentWithSSR;
