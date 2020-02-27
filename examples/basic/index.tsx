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
  Async.ComponentDynamic = lazy(() => import('./components/dynamic'), {
    id: () => (require as any).resolveWeak('./components/dynamic'),
    ssr: false,
  });
}

const Fallback = ({ id }: any) => (
  <div style={{ borderBottom: '2px dotted #E1E' }}>{`<Fallback${id} />`}</div>
);

/**
 * Main App
 */
const App = ({ mode }: any) => {
  const [status, setStatus] = useState('SSR');
  console.log(`----- ${mode} | ${status} ------`);
  useEffect(() => {
    setStatus('INTERACTIVE');
    setTimeout(() => setStatus('LAZY'), 2000);
    setTimeout(() => setStatus('DYNAMIC'), 4000);
  }, []);

  return (
    <div>
      <h1>{window.location.hash || 'hydration'} example</h1>
      <a href="#render">Switch to render</a>
      {' | '}
      <a href="#hydration">Switch to hydration</a>
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
        <p>Dynamic</p>
        {status === 'DYNAMIC' && (
          <>
            <LazySuspense fallback={<Fallback id="Dynamic" />}>
              <Async.ComponentDynamic />
            </LazySuspense>
            <br />
            <LazySuspense fallback={<Fallback id="CachedWithSSR" />}>
              <Async.ComponentWithSSR />
            </LazySuspense>
          </>
        )}
      </main>
    </div>
  );
};

const container = document.querySelector('#root');
const isRender = window.location.hash.includes('render');
const mode = isRender ? MODE.RENDER : MODE.HYDRATE;

if (container) {
  buildComponents();
  setTimeout(() => {
    // simulate server env
    LooselyLazyServer.init(mode);
    const ssr = ReactDOMServer.renderToString(<App mode="SERVER" />);
    container.innerHTML = isRender ? `<div>${ssr}</div>` : ssr;
  }, 100);
}

setTimeout(() => {
  SETTINGS.IS_SERVER = false;
  // client env behaviour
  LooselyLazyClient.init(mode);
  buildComponents();
  ReactDOM[isRender ? 'render' : 'hydrate'](<App mode="CLIENT" />, container);
}, 2000);
