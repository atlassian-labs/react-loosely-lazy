import { useContext, useEffect, useState } from 'react';

import { UntilContext } from './context';

export const useUntil = () => {
  const { subscribe, value } = useContext(UntilContext);
  const [until, setUntil] = useState(value.current);

  useEffect(
    () =>
      subscribe(nextUntil => {
        setUntil(nextUntil);
      }),
    [subscribe]
  );

  return until;
};
