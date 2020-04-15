import { lazyForPaint } from 'react-loosely-lazy';
const NamedExport = lazyForPaint(
  () => {
    const resolved = require('./my-component');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: () => require.resolveWeak('./my-component'),
    moduleId: './my-component',
  }
);
