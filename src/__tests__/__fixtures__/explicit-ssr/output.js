import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitSsr = lazyForPaint(
  () => {
    const resolved = require('./my-component');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    defer: 0,
    getCacheId: () => require.resolveWeak('./my-component'),
    moduleId: './my-component',
  }
);
