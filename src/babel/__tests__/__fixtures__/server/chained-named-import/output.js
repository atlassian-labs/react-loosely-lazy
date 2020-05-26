import { lazyForPaint } from 'react-loosely-lazy';
const ChainedNamedImport = lazyForPaint(
  () => {
    var _temp = require('react'),
      _temp2 = ({ Component }) => Component,
      _temp3 = mod => {
        return mod;
      },
      _temp4 = mod => mod;

    return _temp4(_temp3(_temp2(_temp)));
  },
  {
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('react');
      }

      return 'react';
    },
    moduleId: './node_modules/react/index.js',
  }
);
