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
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./my-component');
      }

      return './my-component';
    },
    moduleId: './my-component',
  }
);
