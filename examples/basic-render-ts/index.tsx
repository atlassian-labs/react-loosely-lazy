/* eslint-disable no-undef, @typescript-eslint/camelcase, @typescript-eslint/ban-ts-ignore */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import '@babel/polyfill';

import LooselyLazyServer from 'react-loosely-lazy/server';
import LooselyLazyClient, {
  lazy,
  LazySuspense,
  LazyWait,
  MODE,
  SETTINGS,
} from 'react-loosely-lazy';

const Async: any = {};

function buildComponents() {
  // force clear webpack cache
  // @ts-ignore
  Object.keys(__webpack_modules__)
    .filter(id => id.includes('/examples/'))
    .forEach(id => {
      // @ts-ignore
      delete __webpack_modules__[id];
    });
  // force components reset faking server/client
  Async.ComponentWithSSR = lazy(() => import('./components/with-ssr'), {
    id: () => (require as any).resolveWeak('./components/with-ssr'),
  });
  Async.ComponentNoSSR = lazy(() => import('./components/no-ssr'), {
    id: () => (require as any).resolveWeak('./components/no-ssr'),
    ssr: false,
  });
  Async.ComponentWaitWithSSR = lazy(
    () => import('./components/wait-with-ssr'),
    {
      id: () => (require as any).resolveWeak('./components/wait-with-ssr'),
    }
  );
  Async.ComponentWaitNoSSR = lazy(() => import('./components/wait-no-ssr'), {
    id: () => (require as any).resolveWeak('./components/wait-no-ssr'),
    ssr: false,
  });
}

const Fallback = ({ id }: any) => (
  <div style={{ borderBottom: '2px dotted #E1E' }}>{`<Fallback${id} />`}</div>
);

/**
 * Main App
 */
const App = () => {
  const [status, setStatus] = useState('SSR');
  useEffect(() => {
    setStatus('INTERACTIVE');
    setTimeout(() => setStatus('LAZY'), 2000);
  }, []);

  return (
    <div>
      <h1>Render example</h1>
      <h3>Status: {status}</h3>
      <main>
        <LazySuspense fallback={<Fallback id="WithSSR" />}>
          <Async.ComponentWithSSR />
        </LazySuspense>
        <br />
        <LazySuspense fallback={<Fallback id="NoSSR" />}>
          <Async.ComponentNoSSR />
        </LazySuspense>
        <br />
        <p>LazyWait</p>
        <LazyWait until={status === 'LAZY'}>
          <LazySuspense fallback={<Fallback id="WaitWithSSR" />}>
            <Async.ComponentWaitWithSSR />
          </LazySuspense>
          <br />
          <LazySuspense fallback={<Fallback id="WaitNoSSR" />}>
            <Async.ComponentWaitNoSSR />
          </LazySuspense>
        </LazyWait>
      </main>
    </div>
  );
};

const container = document.querySelector('#root');

if (container) {
  buildComponents();
  setTimeout(() => {
    // simulate server env
    LooselyLazyServer.init(MODE.RENDER);
    const ssr = ReactDOMServer.renderToString(<App />);
    container.innerHTML = ssr;
  }, 100);
}

setTimeout(() => {
  SETTINGS.IS_SERVER = false;
  // client env behaviour
  LooselyLazyClient.init(MODE.RENDER);
  buildComponents();
  ReactDOM.render(<App />, container);
}, 2000);
