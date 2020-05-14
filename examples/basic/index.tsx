/**
 * NOTE:
 * These examples are currently not working as intended.
 * This has been the case since the change from using SETTINGS.IS_SERVER to isNodeEnvironment happened.
 * To do this properly we will need to create a full app with a server and a client that calls it.
 */

/* eslint-disable no-undef, @typescript-eslint/camelcase, @typescript-eslint/ban-ts-ignore */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import '@babel/polyfill';

import LooselyLazy, {
  lazyForPaint,
  lazyAfterPaint,
  lazy,
  useLazyPhase,
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
  Async.ComponentWithSSR = lazyForPaint(() => import('./components/with-ssr'), {
    getCacheId: () => (require as any).resolveWeak('./components/with-ssr'),
  });
  Async.ComponentNoSSR = lazyForPaint(() => import('./components/no-ssr'), {
    getCacheId: () => (require as any).resolveWeak('./components/no-ssr'),
    ssr: false,
  });
  Async.ComponentDeferWithSSR = lazyAfterPaint(
    () => import('./components/defer-with-ssr'),
    {
      getCacheId: () =>
        (require as any).resolveWeak('./components/defer-with-ssr'),
    }
  );
  Async.ComponentDeferNoSSR = lazy(() => import('./components/defer-no-ssr'), {
    getCacheId: () => (require as any).resolveWeak('./components/defer-no-ssr'),
  });
  Async.ComponentWaitWithSSR = lazyForPaint(
    () => import('./components/wait-with-ssr'),
    {
      getCacheId: () =>
        (require as any).resolveWeak('./components/wait-with-ssr'),
    }
  );
  Async.ComponentWaitNoSSR = lazyForPaint(
    () => import('./components/wait-no-ssr'),
    {
      getCacheId: () =>
        (require as any).resolveWeak('./components/wait-no-ssr'),
      ssr: false,
    }
  );
  Async.ComponentDynamic = lazyForPaint(() => import('./components/dynamic'), {
    getCacheId: () => (require as any).resolveWeak('./components/dynamic'),
  });
}

const Fallback = ({ id }: any) => (
  <div style={{ borderBottom: '2px dotted #E1E' }}>{`<Fallback${id} />`}</div>
);

const BootstrapComponents = React.memo(() => (
  <>
    <LazySuspense fallback={<Fallback id="WithSSR" />}>
      <Async.ComponentWithSSR />
    </LazySuspense>
    <br />
    <LazySuspense fallback={<Fallback id="NoSSR" />}>
      <Async.ComponentNoSSR />
    </LazySuspense>
  </>
));

const InteractiveComponents = React.memo(() => (
  <>
    <LazySuspense fallback={<Fallback id="DeferWithSSR" />}>
      <Async.ComponentDeferWithSSR />
    </LazySuspense>
    <br />
    <LazySuspense fallback={<Fallback id="DeferNoSSR" />}>
      <Async.ComponentDeferNoSSR />
    </LazySuspense>
  </>
));

const LazyComponents = React.memo(({ status }: any) => (
  <>
    <LazyWait until={status === 'LAZY'}>
      <LazySuspense fallback={<Fallback id="WaitWithSSR" />}>
        <Async.ComponentWaitWithSSR />
      </LazySuspense>
      <br />
      <LazySuspense
        fallback={
          status === 'LAZY' ? <Fallback id={`WaitNoSSR-${status}`} /> : <br />
        }
      >
        <Async.ComponentWaitNoSSR />
      </LazySuspense>
    </LazyWait>
  </>
));

const DynamicComponents = React.memo(() => (
  <>
    <LazySuspense fallback={<Fallback id="Dynamic" />}>
      <Async.ComponentDynamic />
    </LazySuspense>
    <br />
    <LazySuspense fallback={<Fallback id="CachedWithSSR" />}>
      <Async.ComponentWithSSR />
    </LazySuspense>
  </>
));

/**
 * Main App
 */
const App = ({ mode }: any) => {
  const [status, setStatus] = useState('SSR');
  const { startNextPhase } = useLazyPhase();
  console.log(`----- ${mode} | ${status} ------`);
  useEffect(() => {
    setStatus('PAINT');
    setTimeout(() => {
      startNextPhase();
      setStatus('AFTER PAINT');
    }, 2000);
    setTimeout(() => setStatus('WAIT A LIL BIT...'), 4000);
    setTimeout(() => setStatus('LAZY'), 6000);
  }, [startNextPhase]);

  return (
    <div>
      <h1>{window.location.hash || 'hydration'} example</h1>
      <a href="#render">Switch to render</a>
      {' | '}
      <a href="#hydration">Switch to hydration</a>
      <h3>Status: {status}</h3>
      <main>
        <BootstrapComponents />
        <br />
        <p>Statically deferred</p>
        <InteractiveComponents />
        <br />
        <p>LazyWait</p>
        <LazyComponents status={status} />
        <p>Dynamic</p>
        {status === 'LAZY' && <DynamicComponents />}
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
    // @ts-ignore - this will no longer work but were simulating server env behaviour
    SETTINGS.IS_SERVER = true;
    LooselyLazy.init(mode);
    const ssr = ReactDOMServer.renderToString(<App mode="SERVER" />);
    container.innerHTML = isRender ? `<div>${ssr}</div>` : ssr;
  }, 100);
}

setTimeout(() => {
  // @ts-ignore - this will no longer work but were simulating client env behaviour
  SETTINGS.IS_SERVER = false;
  LooselyLazy.init(mode);
  buildComponents();
  ReactDOM.render(<App mode="CLIENT" />, container);
}, 2000);
