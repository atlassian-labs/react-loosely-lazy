import { lazyForPaint } from 'react-loosely-lazy';
const ImplicitSsr = lazyForPaint(
  () => {
    const resolved = require('./my-component');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: (
      require.resolveWeak ||
      function (v) {
        return v;
      }
    )('./my-component'),
    moduleId: './my-component',
  }
);
