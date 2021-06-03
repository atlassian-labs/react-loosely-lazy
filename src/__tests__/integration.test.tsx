import React, { ReactElement, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { render, act } from '@testing-library/react';

import LooselyLazy, {
  lazyForPaint,
  lazyAfterPaint,
  LazySuspense,
  useLazyPhase,
  MODE,
} from '..';
import { PHASE } from '../constants';
import { isNodeEnvironment } from '../utils';

import { createMockImport, nextTick } from './test-utils';

jest.mock('../utils', () => ({
  ...jest.requireActual<any>('../utils'),
  isNodeEnvironment: jest.fn(),
}));

describe.each([true, false])('when autoStart is %s', autoStart => {
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
    const { mockImport, resolveImport } = createMockImport(
      Child,
      ssr && server
    );
    // @ts-ignore - We are mocking the import
    const AsyncComponent = lazyMethod(() => mockImport, {
      moduleId: './mock',
      ssr,
    });

    LooselyLazy.init({
      autoStart,
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

    return {
      App,
      Child,
      Fallback,
      resolveImport,
    };
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
            <div id="root">${ReactDOMServer.renderToString(<ServerApp />)}</div>
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
            <div id="root">${ReactDOMServer.renderToString(<ServerApp />)}</div>
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
            <div id="root">${ReactDOMServer.renderToString(<ServerApp />)}</div>
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

          if (autoStart) {
            // expect client to use placeholder and persist ssr content until the loader is scheduled
            expect(Child).not.toHaveBeenCalled();
            expect(container).toContainHTML('<p class="p">Content</p>');
            expect(container.querySelector('input')).toBeInTheDocument();

            // simulate component being ready on next tick
            await act(resolveImport);
          } else {
            // simulate component being ready on next tick
            await act(resolveImport);

            // expect client to use placeholder and persist ssr content regardless
            expect(Child).not.toHaveBeenCalled();
            expect(container).toContainHTML('<p class="p">Content</p>');
            expect(container.querySelector('input')).toBeInTheDocument();

            rerender(<ClientApp phase={PHASE.AFTER_PAINT} />);

            await nextTick();
          }

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
            <div id="root">${ReactDOMServer.renderToString(<ServerApp />)}</div>
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

          if (autoStart) {
            // expect client to use live fallback ASAP
            expect(Child).not.toHaveBeenCalled();
            expect(Fallback).toHaveBeenCalled();
            expect(container).toContainHTML('<i>Fallback</i>');
            expect(container.querySelector('input')).not.toBeInTheDocument();

            // simulate component being ready on next tick
            await act(resolveImport);
          } else {
            // simulate component being ready on next tick
            await act(resolveImport);

            // expect client to use live fallback ASAP
            expect(Child).not.toHaveBeenCalled();
            expect(Fallback).toHaveBeenCalled();
            expect(container).toContainHTML('<i>Fallback</i>');
            expect(container.querySelector('input')).not.toBeInTheDocument();

            rerender(<ClientApp phase={PHASE.AFTER_PAINT} />);

            await nextTick();
          }

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
            <div id="root">${ReactDOMServer.renderToString(<ServerApp />)}</div>
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
            <div id="root">${ReactDOMServer.renderToString(<ServerApp />)}</div>
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

  // describe('with wait priority', () => {
  //   describe('with SSR', () => {
  //     it('should render content in SSR, persist SSR output while loading, and finally replace', () => {});
  //   });

  //   describe('without SSR', () => {
  //     it('should render fallback in SSR, persist SSR output initially, render fallback, and finally replace', () => {});
  //   });
  // });
});
