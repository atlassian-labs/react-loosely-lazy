import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitNoSsr = lazyForPaint(() => import('./my-component'), {
  ssr: false,
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('./my-component');
    }

    return './my-component';
  },
  moduleId: './my-component',
});
