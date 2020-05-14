import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitNoSsr = lazyForPaint(
  () => import('react-loosely-lazy-component'),
  {
    ssr: false,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('react-loosely-lazy-component');
      }

      return 'react-loosely-lazy-component';
    },
    moduleId: './node_modules/react-loosely-lazy-component/build/index.js',
  }
);
