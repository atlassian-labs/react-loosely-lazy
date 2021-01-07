import React, { ComponentType } from 'react';
import LooselyLazy, {
  LazySuspense,
  lazyForPaint,
  MODE,
} from 'react-loosely-lazy';
import {
  AsyncComponentConsumer,
  AsyncComponentConsumerProps,
} from './async-component-consumer';

type AppProps = {
  Main: ComponentType<{ source: string }>;
  name: string;
  resolve: AsyncComponentConsumerProps['resolve'];
};

const App = ({ Main, name, resolve }: AppProps) => (
  <main>
    <h1>{name}</h1>
    <div style={{ display: 'flex' }}>
      <LazySuspense fallback={<div>Loading...</div>}>
        <Main source="lazy" />
      </LazySuspense>
      <AsyncComponentConsumer bundleName="async-main" resolve={resolve}>
        {({ component: Component }) =>
          Component ? (
            <Component source="async-component-consumer" />
          ) : (
            <div>Loading...</div>
          )
        }
      </AsyncComponentConsumer>
    </div>
  </main>
);

export function buildServerApp(mode: keyof typeof MODE) {
  // Force components reset faking server/client
  window.name = 'nodejs';
  LooselyLazy.init({ mode });

  const Main = lazyForPaint(() => require('./main'));

  const resolve = () => require('./main');

  return () => <App Main={Main} name="server" resolve={resolve} />;
}

export function buildClientApp(mode: keyof typeof MODE) {
  // Force components reset faking server/client
  window.name = '';
  LooselyLazy.init({ mode });

  const Main = lazyForPaint(() => import('./main'));

  const resolve = () => import('./main');

  return () => <App Main={Main} name="client" resolve={resolve} />;
}
