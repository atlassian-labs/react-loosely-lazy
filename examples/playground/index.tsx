import React, {
  useState,
  useEffect,
  FunctionComponent,
  StrictMode,
} from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { useLazyPhase, MODE } from 'react-loosely-lazy';

import { listeners, steps, pastSteps } from './constants';
import { buildServerComponents, buildClientComponents } from './components';
import { isFailSsr, isRender } from './utils';

/**
 * Controls App
 */
const Controls = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [step, setStep] = useState(steps[stepIndex]);

  useEffect(() => {
    pastSteps.add(steps[stepIndex]);
    setStep(steps[stepIndex]);
  }, [stepIndex, setStep]);

  useEffect(() => {
    listeners.forEach(l => l(step));
  }, [step]);

  return (
    <div>
      <h1>{window.location.search.replace('?', '') || 'hydration'} example</h1>
      <p>
        <a href="./?render">Switch to render</a>
        {' | '}
        <a href="./?hydration">Switch to hydration</a>
        {' | '}
        <a href="./?failssr">Switch to failing ssr</a>
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
      <button
        onClick={() => setStepIndex(Math.min(stepIndex + 1, steps.length - 1))}
      >
        Next step
      </button>
    </div>
  );
};

/**
 * Main App
 */
type AppProps = {
  initialStep: string;
  components: {
    ForPaint: FunctionComponent<any>;
    AfterPaint: FunctionComponent<any>;
    Lazy: FunctionComponent<any>;
    CustomWait: FunctionComponent<any>;
  };
};

const App = ({ initialStep, components }: AppProps) => {
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
  }, [step, startNextPhase]);

  return (
    <StrictMode>
      <h1>&nbsp;</h1>
      <main>
        <components.ForPaint />
        <components.AfterPaint />
        <components.Lazy />
        <components.CustomWait step={step} />
      </main>
    </StrictMode>
  );
};

const renderApp = (v: string) => {
  const appContainer = document.querySelector('#app');
  const mode = isRender() ? MODE.RENDER : MODE.HYDRATE;

  if (v === 'SSR' && appContainer && !isFailSsr()) {
    const components = buildServerComponents(mode);
    const ssr = renderToString(<App initialStep={v} components={components} />);
    appContainer.innerHTML = isRender() ? `<div>${ssr}</div>` : ssr;
  }
  if (v === 'PAINT LOADING') {
    const components = buildClientComponents(mode);
    if (isRender()) {
      createRoot(appContainer!).render(
        <App initialStep={v} components={components} />
      );
    } else {
      hydrateRoot(
        appContainer!,
        <App initialStep={v} components={components} />
      );
    }
  }
};

listeners.add(renderApp);

createRoot(document.querySelector('#controls')!).render(<Controls />);
