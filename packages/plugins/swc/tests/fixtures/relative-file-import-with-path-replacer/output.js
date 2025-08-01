import { lazyForPaint } from 'react-loosely-lazy';
const RelativeFileImportWithBasePath = lazyForPaint(()=>require('./__mocks__/imports/base-path-component'), {
    moduleId: "./__mocks__/imports/base-path-component.js"
});