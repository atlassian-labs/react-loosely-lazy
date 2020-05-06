import { lazyForPaint } from 'react-loosely-lazy';
const NamedExport = lazyForPaint(
  () => {
    const resolved = require('./my-component');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./my-component');
      }

      return './my-component';
    },
    moduleId: './my-component',
  }
);
