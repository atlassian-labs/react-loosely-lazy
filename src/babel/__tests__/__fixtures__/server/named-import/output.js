import { lazyForPaint } from 'react-loosely-lazy';
const NamedImport = lazyForPaint(
  () => {
    var _temp = require('react'),
      _temp2 = ({ Component }) => Component;

    return _temp2(_temp);
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
