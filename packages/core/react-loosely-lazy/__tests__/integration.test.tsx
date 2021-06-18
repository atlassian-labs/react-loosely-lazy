import { render, act } from '@testing-library/react';
import React, { ReactElement, useEffect } from 'react';
import { renderToString } from 'react-dom/server';

import LooselyLazy, {
  lazyForPaint,
  lazyAfterPaint,
  LazySuspense,
  useLazyPhase,
  MODE,
} from '../src';
import { PHASE } from '../src/constants';
import { isNodeEnvironment } from '../src/utils';

import { createMockImport, nextTick } from './test-utils';

jest.mock('../src/utils', () => ({
  ...jest.requireActual<any>('../src/utils'),
  isNodeEnvironment: jest.fn(),
}));

const createApp = ({
  hydrate,
  lazyMethod = lazyForPaint,
  server,
  ssr,
}: {
  hydrate: boolean;
  lazyMethod?: typeof lazyForPaint;
  server: boolean;
  ssr: boolean;
}) => {
  (isNodeEnvironment as any).mockImplementation(() => server);

  const Child = jest.fn(() => <p className="p">Content</p>);
  const Fallback = jest.fn<any, void[]>(() => <i>Fallback</i>);
  const { mockImport, resolveImport } = createMockImport(Child, ssr && server);
  // @ts-ignore - We are mocking the import
  const AsyncComponent = lazyMethod(() => mockImport, {
    moduleId: './mock',
    ssr,
  });

  LooselyLazy.init({
    mode: hydrate ? MODE.HYDRATE : MODE.RENDER,
    manifest: {
      publicPath: '/',
      assets: {
        './mock': [''],
      },
    },
  });

  const PhaseManager = ({
    children,
    phase,
  }: {
    children: ReactElement;
    phase?: number;
  }) => {
    const { startNextPhase } = useLazyPhase();
    useEffect(() => {
      if (phase === PHASE.AFTER_PAINT) startNextPhase();
    }, [phase, startNextPhase]);

    return children;
  };

  const App = ({ phase }: { phase?: number }) => (
    <PhaseManager phase={phase}>
      <LazySuspense fallback={<Fallback />}>
        <AsyncComponent />
      </LazySuspense>
    </PhaseManager>
  );

  return { App, resolveImport, Fallback, Child };
};

describe('hydrates', () => {
  const hydrate = true;

  describe('a lazyForPaint component', () => {
    describe('when ssr is true', () => {
      const ssr = true;

      it('by rendering and persisting the server content, before replacing', async () => {
        const { App: ServerApp } = createApp({
          hydrate,
          server: true,
          ssr,
        });

        document.body.innerHTML = `
          <div id="root">${renderToString(<ServerApp />)}</div>
        `;

        // expect ssr to render content
        expect(document.body).toContainHTML('<p class="p">Content</p>');
        expect(document.body.querySelector('input')).toBeInTheDocument();

        const {
          App: ClientApp,
          Child,
          resolveImport,
        } = createApp({
          hydrate,
          server: false,
          ssr,
        });

        const { container } = render(<ClientApp />, {
          container: document.getElementById('root') as HTMLElement,
          hydrate,
        });

        // expect client to use placeholder and persist ssr content
        expect(Child).not.toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).toBeInTheDocument();

        await act(resolveImport);

        // expect component to be live after being resolved
        expect(Child).toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });

    describe('when ssr is false', () => {
      const ssr = false;

      it('by rendering the server fallback, before rendering the fallback and replacing', async () => {
        const { App: ServerApp } = createApp({
          hydrate,
          server: true,
          ssr,
        });

        document.body.innerHTML = `
          <div id="root">${renderToString(<ServerApp />)}</div>
        `;

        // expect ssr to render fallback
        expect(document.body).toContainHTML('<i>Fallback</i>');
        expect(document.body.querySelector('input')).toBeInTheDocument();

        const {
          App: ClientApp,
          Child,
          Fallback,
          resolveImport,
        } = createApp({
          hydrate,
          server: false,
          ssr,
        });

        const { container } = render(<ClientApp />, {
          container: document.getElementById('root') as HTMLElement,
          hydrate,
        });

        // expect client to use live fallback ASAP
        expect(Child).not.toHaveBeenCalled();
        expect(Fallback).toHaveBeenCalled();
        expect(container).toContainHTML('<i>Fallback</i>');
        expect(container.querySelector('input')).not.toBeInTheDocument();

        await act(resolveImport);

        // expect component to be live after being resolved
        expect(Child).toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });
  });

  describe('a lazyAfterPaint component', () => {
    const lazyMethod = lazyAfterPaint;

    describe('when ssr is true', () => {
      const ssr = true;

      it('by rendering and persisting the server content, before replacing', async () => {
        const { App: ServerApp } = createApp({
          hydrate,
          lazyMethod,
          server: true,
          ssr,
        });

        document.body.innerHTML = `
          <div id="root">${renderToString(<ServerApp />)}</div>
        `;

        // expect ssr to render content
        expect(document.body).toContainHTML('<p class="p">Content</p>');
        expect(document.body.querySelector('input')).toBeInTheDocument();

        const {
          App: ClientApp,
          Child,
          resolveImport,
        } = createApp({
          hydrate,
          lazyMethod,
          server: false,
          ssr,
        });

        const { container, rerender } = render(<ClientApp />, {
          container: document.getElementById('root') as HTMLElement,
          hydrate,
        });

        // simulate component being ready on next tick
        await act(resolveImport);

        // expect client to use placeholder and persist ssr content regardless
        expect(Child).not.toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).toBeInTheDocument();

        rerender(<ClientApp phase={PHASE.AFTER_PAINT} />);

        await nextTick();

        // expect component to be live after phase changed
        expect(Child).toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });

    describe('when ssr is false', () => {
      const ssr = false;

      it('by rendering the server fallback, before rendering the fallback and replacing', async () => {
        const { App: ServerApp } = createApp({
          hydrate,
          lazyMethod,
          server: true,
          ssr,
        });

        document.body.innerHTML = `
          <div id="root">${renderToString(<ServerApp />)}</div>
        `;

        // expect ssr to render fallback
        expect(document.body).toContainHTML('<i>Fallback</i>');
        expect(document.body.querySelector('input')).toBeInTheDocument();

        const {
          App: ClientApp,
          Child,
          Fallback,
          resolveImport,
        } = createApp({
          hydrate,
          lazyMethod,
          server: false,
          ssr,
        });

        const { container, rerender } = render(<ClientApp />, {
          container: document.getElementById('root') as HTMLElement,
          hydrate,
        });

        // simulate component being ready on next tick
        await act(resolveImport);

        // expect client to use live fallback ASAP
        expect(Child).not.toHaveBeenCalled();
        expect(Fallback).toHaveBeenCalled();
        expect(container).toContainHTML('<i>Fallback</i>');
        expect(container.querySelector('input')).not.toBeInTheDocument();

        rerender(<ClientApp phase={PHASE.AFTER_PAINT} />);

        await nextTick();

        // expect component to be live after phase changed
        expect(Child).toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });
  });
});

describe('renders', () => {
  const hydrate = false;

  describe('a lazyForPaint component', () => {
    describe('when ssr is true', () => {
      const ssr = true;

      it('by rendering and persisting the server content, before replacing', async () => {
        const { App: ServerApp } = createApp({
          hydrate,
          server: true,
          ssr,
        });

        document.body.innerHTML = `
          <div id="root">${renderToString(<ServerApp />)}</div>
        `;

        // expect ssr to render content
        expect(document.body).toContainHTML('<p class="p">Content</p>');
        expect(document.body.querySelector('input')).toBeInTheDocument();

        const {
          App: ClientApp,
          Child,
          resolveImport,
        } = createApp({
          hydrate,
          server: false,
          ssr,
        });

        const { container } = render(<ClientApp />, {
          container: document.getElementById('root') as HTMLElement,
          hydrate,
        });

        // expect client to use placeholder and persist ssr content
        expect(Child).not.toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).toBeInTheDocument();

        await act(resolveImport);

        // expect component to be live after being resolved
        expect(Child).toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });

    describe('when ssr is false', () => {
      const ssr = false;

      it('by rendering the server fallback, before rendering the fallback and replacing', async () => {
        const { App: ServerApp } = createApp({
          hydrate,
          server: true,
          ssr,
        });

        document.body.innerHTML = `
          <div id="root">${renderToString(<ServerApp />)}</div>
        `;

        // expect ssr to render fallback
        expect(document.body).toContainHTML('<i>Fallback</i>');
        expect(document.body.querySelector('input')).toBeInTheDocument();

        const {
          App: ClientApp,
          Child,
          Fallback,
          resolveImport,
        } = createApp({
          hydrate,
          server: false,
          ssr,
        });

        const { container } = render(<ClientApp />, {
          container: document.getElementById('root') as HTMLElement,
          hydrate,
        });

        // expect client to use live fallback ASAP
        expect(Child).not.toHaveBeenCalled();
        expect(Fallback).toHaveBeenCalled();
        expect(container).toContainHTML('<i>Fallback</i>');
        expect(container.querySelector('input')).not.toBeInTheDocument();

        await act(resolveImport);

        // expect component to be live after being resolved
        expect(Child).toHaveBeenCalled();
        expect(container).toContainHTML('<p class="p">Content</p>');
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });
  });
});
