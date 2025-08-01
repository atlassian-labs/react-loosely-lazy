import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitNoSSR = lazyForPaint(()=>()=>null, {
    ssr: false,
    moduleId: "./node_modules/react/index.js"
});