/* eslint-disable no-undef, @typescript-eslint/camelcase, @typescript-eslint/ban-ts-ignore */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import '@babel/polyfill';

import LooselyLazyServer from 'react-loosely-lazy/server';
import LooselyLazyClient, {
  lazyForCritical,
  lazyAfterCritical,
  lazyOnDemand,
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
  Async.ComponentWithSSR = lazyForCritical(
    () => import('./components/with-ssr'),
    {
      id: () => (require as any).resolveWeak('./components/with-ssr'),
    }
  );
  Async.ComponentNoSSR = lazyForCritical(() => import('./components/no-ssr'), {
    id: () => (require as any).resolveWeak('./components/no-ssr'),
    ssr: false,
  });
  Async.ComponentDeferWithSSR = lazyAfterCritical(
    () => import('./components/defer-with-ssr'),
    {
      id: () => (require as any).resolveWeak('./components/defer-with-ssr'),
    }
  );
  Async.ComponentDeferNoSSR = lazyOnDemand(
    () => import('./components/defer-no-ssr'),
    {
      id: () => (require as any).resolveWeak('./components/defer-no-ssr'),
    }
  );
  Async.ComponentWaitWithSSR = lazyForCritical(
    () => import('./components/wait-with-ssr'),
    {
      id: () => (require as any).resolveWeak('./components/wait-with-ssr'),
    }
  );
  Async.ComponentWaitNoSSR = lazyForCritical(
    () => import('./components/wait-no-ssr'),
    {
      id: () => (require as any).resolveWeak('./components/wait-no-ssr'),
      ssr: false,
    }
  );
  Async.ComponentDynamic = lazyForCritical(
    () => import('./components/dynamic'),
    {
      id: () => (require as any).resolveWeak('./components/dynamic'),
    }
  );
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
  const { setPhaseAfterCritical, setPhaseOnDemand } = useLazyPhase();
  console.log(`----- ${mode} | ${status} ------`);
  useEffect(() => {
    setStatus('CRITICAL');
    setTimeout(() => {
      setPhaseAfterCritical();
      setPhaseOnDemand();
      setStatus('AFTER CRITICAL');
    }, 2000);
    setTimeout(() => setStatus('WAIT A LIL BIT...'), 4000);
    setTimeout(() => setStatus('ON DEMAND'), 6000);
  }, [setPhaseAfterCritical, setPhaseOnDemand]);

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
        {status === 'ON DEMAND' && <DynamicComponents />}
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
  ReactDOM.render(<App mode="CLIENT" />, container);
}, 2000);
