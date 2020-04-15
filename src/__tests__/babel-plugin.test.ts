// @ts-ignore - babel-plugin-tester doesn't export types
import pluginTester from 'babel-plugin-tester';
import plugin from '../babel';
import path from 'path';

pluginTester({
  plugin,
  pluginName: 'react-loosely-lazy',
  fixtures: path.join(__dirname, '__fixtures__/babel'),
});
