import React from 'react';
import ReactDOM from 'react-dom';
import { Static } from './components';
import { lazyForPaint } from './react-loosely-lazy-mock';

const Dynamic = import('./components/dynamic.js');
const Lazy = lazyForPaint(() => import('./components/lazy.js'));

const App = () => (
  <div>
    <Static />
    <Dynamic />
    <Lazy />
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));
