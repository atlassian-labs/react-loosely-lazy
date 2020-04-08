import { lazy } from 'react-loosely-lazy';

const ImplicitNoSsr = lazy(() => import('./my-component'));
