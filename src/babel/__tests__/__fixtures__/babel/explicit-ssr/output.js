import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitSsr = lazyForPaint(
  () => {
    const resolved = require('react');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    defer: 0,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('react');
      }

      return 'react';
    },
    moduleId: './node_modules/react/index.js',
  }
);
