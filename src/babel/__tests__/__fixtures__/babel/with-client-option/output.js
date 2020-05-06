import { lazyForPaint } from 'react-loosely-lazy';
const WithClientOption = lazyForPaint(() => import('./my-component'), {
  ssr: true,
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('./my-component');
    }

    return './my-component';
  },
  moduleId: './my-component',
});
