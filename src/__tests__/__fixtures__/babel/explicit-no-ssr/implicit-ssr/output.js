import { lazyForPaint } from './node_modules/react-loosely-lazy';
const ImplicitSsr = lazyForPaint(
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
