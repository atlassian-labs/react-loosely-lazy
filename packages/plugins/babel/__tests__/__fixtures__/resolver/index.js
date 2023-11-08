const { join } = require('path');

module.exports = {
  resolveSync(_, filename, importPath) {
    if (importPath === '@custom-package') {
      return join(__dirname, 'local-custom-package/index.js');
    }

    throw new Error('Unreachable code');
  },
};
