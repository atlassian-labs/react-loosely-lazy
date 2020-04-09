import { lazyForPaint } from './node_modules/react-loosely-lazy';

const ImplicitSsr = lazyForPaint(() => import('./my-component'));
