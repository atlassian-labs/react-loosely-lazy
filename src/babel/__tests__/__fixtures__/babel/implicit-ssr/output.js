import { lazyForPaint } from 'react-loosely-lazy';
const ImplicitSsr = lazyForPaint(
  () => {
    const resolved = require('react-loosely-lazy-component');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('react-loosely-lazy-component');
      }

      return 'react-loosely-lazy-component';
    },
    moduleId: './node_modules/react-loosely-lazy-component/build/index.js',
  }
);
