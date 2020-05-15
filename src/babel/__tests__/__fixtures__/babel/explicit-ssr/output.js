import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitSsr = lazyForPaint(
  () => {
    const resolved = require('prop-types');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    defer: 0,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('prop-types');
      }

      return 'prop-types';
    },
    moduleId: './node_modules/prop-types/index.js',
  }
);
