import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import { useLazyPhase, MODE } from 'react-loosely-lazy';
import { listeners } from './utils';

import {
  ForPaintComponents,
  AfterPaintComponents,
  LazyComponents,
  CustomWaitComponents,
  buildServerComponents,
  buildClientComponents,
} from './components';

const steps = [
  'SSR',
  'PAINT LOADING',
  'PAINT FETCHING',
  'PAINT READY',
  'AFTER LOADING',
  'AFTER FETCHING',
  'AFTER READY', // also 'LAZY READY'
  'CUSTOM LOADING',
  'CUSTOM FETCHING',
  'CUSTOM READY',
];

/**
 * Controls App
 */
const Controls = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [step, setStep] = useState(steps[stepIndex]);
  const resetSteps = () => setStepIndex(0);

  useEffect(() => {
    (window as any).step = steps[stepIndex];
    setStep(steps[stepIndex]);
  }, [stepIndex, setStep]);

  useEffect(() => {
    listeners.forEach(l => l(step));
  }, [step]);

  return (
    <div>
      <h1>{window.location.hash || 'hydration'} example</h1>
      <p>
        <a href="#render" onClick={() => resetSteps()}>
          Switch to render
        </a>
        {' | '}
        <a href="#hydration" onClick={() => resetSteps()}>
          Switch to hydration
        </a>
        {' | '}
        <a href="#failssr" onClick={() => resetSteps()}>
          Switch to failing ssr
        </a>
      </p>
      <ul>
        {steps.map(v => (
          <li key={v}>
            <label>
              <input type="radio" checked={step === v} readOnly /> {v}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={() => setStepIndex(stepIndex + 1)}>Next step</button>
    </div>
  );
};

/**
 * Main App
 */
const App = ({ initialStep }: { initialStep: string }) => {
  const [step, setStep] = useState(initialStep);
  const { startNextPhase } = useLazyPhase();

  useEffect(() => {
    const listener = (v: string) => setStep(v);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [setStep]);

  useEffect(() => {
    if (step === 'AFTER LOADING') {
      startNextPhase();
    }
  }, [step]);

  return (
    <>
      <h1>&nbsp;</h1>
      <main>
        <ForPaintComponents />
        <AfterPaintComponents />
        <LazyComponents />
        <CustomWaitComponents step={step} />
      </main>
    </>
  );
};

const renderApp = (v: string) => {
  const appContainer = document.querySelector('#app');
  const isFailSsr = window.location.hash.includes('failssr');
  const isRender = isFailSsr || window.location.hash.includes('render');
  const mode = isRender ? MODE.RENDER : MODE.HYDRATE;

  if (v === 'SSR' && appContainer && !isFailSsr) {
    buildServerComponents(mode);
    const ssr = ReactDOMServer.renderToString(<App initialStep={v} />);
    appContainer.innerHTML = isRender ? `<div>${ssr}</div>` : ssr;
  }
  if (v === 'PAINT LOADING') {
    buildClientComponents(mode);
    ReactDOM[isRender ? 'render' : 'hydrate'](
      <App initialStep={v} />,
      appContainer
    );
  }
};

listeners.add(renderApp);

ReactDOM.render(<Controls />, document.querySelector('#controls'));
