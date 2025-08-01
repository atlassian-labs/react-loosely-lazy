import { lazyForPaint } from 'react-loosely-lazy';
const RelativeFileImport = lazyForPaint(()=>require('./__mocks__/imports/js-component'), {
    moduleId: "./__mocks__/imports/js-component.js"
});