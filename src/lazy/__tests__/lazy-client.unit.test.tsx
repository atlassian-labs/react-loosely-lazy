import React, { ComponentType } from 'react';
import { render, waitForElementToBeRemoved } from '@testing-library/react';
import { PHASE, PRIORITY } from '../../constants';
import { LooselyLazy } from '../../init';
import { LazySuspense } from '../../suspense';

import { lazyForPaint, lazyAfterPaint, lazy } from '..';
import {
  App,
  createClientLoader,
  createErrorTests,
  ErrorBoundary,
  testFallbackRender,
  testRender,
  TestRenderOptions,
} from './test-utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: () => false,
}));

jest.mock('../../constants', () => ({
  ...jest.requireActual<any>('../../constants'),
  RETRY_DELAY: 1,
}));

describe('lazy* on the client', () => {
  const lazyOptions = {
    moduleId: '@foo/bar',
  };

  afterEach(() => {
    LooselyLazy.init({}); // reset settings
    document.head.innerHTML = ''; // reset head
  });

  describe.each([true, false])('when autoStart is %s', autoStart => {
    const createRenderTests = (
      opts: Required<Pick<TestRenderOptions, 'lazyMethod' | 'phase'>>
    ) => {
      const { lazyMethod, phase } = opts;

      it('renders the default component when there is only a default export', async () => {
        const text = 'Default Component';

        await testRender({
          loader: createClientLoader({ text }),
          text,
          ...opts,
        });
      });

      it('renders the named component when there is only a named export', async () => {
        const NamedComponent = () => <div>Named Component</div>;

        await testRender({
          loader: () =>
            Promise.resolve({ NamedComponent }).then(m => m.NamedComponent),
          text: 'Named Component',
          ...opts,
        });
      });

      it('renders the default component when there are default and named exports', async () => {
        const DefaultComponent = () => <div>Default Component</div>;
        const NamedComponent = () => <div>Named Component</div>;

        await testRender({
          loader: () =>
            Promise.resolve({ default: DefaultComponent, NamedComponent }),
          text: 'Default Component',
          ...opts,
        });
      });

      it('renders the named component when there are default and named exports', async () => {
        const DefaultComponent = () => <div>Default Component</div>;
        const NamedComponent = () => <div>Named Component</div>;

        await testRender({
          loader: () =>
            Promise.resolve({ default: DefaultComponent, NamedComponent }).then(
              m => m.NamedComponent
            ),
          text: 'Named Component',
          ...opts,
        });
      });

      it('renders the component when the loader resolves after a single failed attempt', async () => {
        const text = 'Default Component';
        const successfulLoader = createClientLoader({ text });

        LooselyLazy.init({
          autoStart,
          retry: 1,
        });

        let shouldFail = true;

        await testRender({
          loader: () => {
            if (shouldFail) {
              shouldFail = false;

              return Promise.reject(new Error('Failed to load module...'));
            }

            return successfulLoader();
          },
          text,
          ...opts,
        });
      });

      it('renders the component when the loader resolves after multiple failed attempts', async () => {
        const text = 'Default Component';
        const successfulLoader = createClientLoader({ text });

        let attempt = 1;
        const retryCount = 3;

        LooselyLazy.init({
          autoStart,
          retry: retryCount,
        });

        await testRender({
          loader: () => {
            if (attempt <= retryCount) {
              attempt += 1;

              return Promise.reject(new Error('Failed to load module...'));
            }

            return successfulLoader();
          },
          text,
          ...opts,
        });
      });

      it('renders the component when the loader resolves after manually retrying', async () => {
        const text = 'Default Component';
        const successfulLoader = createClientLoader({ text });

        let attempt = 1;
        const retryCount = 3;

        LooselyLazy.init({
          autoStart,
          retry: retryCount,
        });

        const preloadAttempts = lazyMethod === lazyAfterPaint ? 1 : 0;
        const LazyTestComponent = lazyMethod(() => {
          if (attempt <= retryCount + 1 + preloadAttempts) {
            attempt += 1;

            return Promise.reject(new Error('Failed to load module...'));
          }

          return successfulLoader();
        });

        const consoleError = jest
          .spyOn(console, 'error')
          .mockImplementation(jest.fn);

        const { getByText, queryByText } = render(
          <App phase={phase}>
            <ErrorBoundary fallback="Component failed to load...">
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </ErrorBoundary>
          </App>
        );

        expect(queryByText('Loading...')).toBeInTheDocument();
        await waitForElementToBeRemoved(() => queryByText('Loading...'));

        consoleError.mockRestore();

        expect(queryByText('Component failed to load...')).toBeInTheDocument();

        getByText('Retry').click();

        expect(queryByText('Loading...')).toBeInTheDocument();
        await waitForElementToBeRemoved(() => queryByText('Loading...'));

        expect(queryByText(text)).toBeInTheDocument();
      });

      it('re-renders the component correctly', async () => {
        const text = 'Default Component';
        const LazyTestComponent = lazyMethod(createClientLoader({ text }));

        const { getByText, queryByText, rerender } = render(
          <App phase={phase}>
            <LazySuspense fallback="Loading...">
              <LazyTestComponent />
            </LazySuspense>
          </App>
        );

        expect(queryByText('Loading...')).toBeInTheDocument();
        await waitForElementToBeRemoved(() => queryByText('Loading...'));

        const component = getByText(text);

        expect(component).toBeInTheDocument();

        rerender(
          <App phase={phase}>
            <LazySuspense fallback="Loading...">
              <LazyTestComponent />
            </LazySuspense>
          </App>
        );

        expect(component).toBeInTheDocument();
      });

      it('re-renders the component correctly when it is updated', async () => {
        type TestComponentProps = { renderPass: number };

        const TestComponent = ({ renderPass }: TestComponentProps) => (
          <div>Component render pass ({renderPass})</div>
        );

        const LazyTestComponent = lazyMethod<ComponentType<TestComponentProps>>(
          () => Promise.resolve({ default: TestComponent }),
          lazyOptions
        );

        const { queryByText, rerender } = render(
          <App phase={phase}>
            <LazySuspense fallback="Loading...">
              <LazyTestComponent renderPass={1} />
            </LazySuspense>
          </App>
        );

        expect(queryByText('Loading...')).toBeInTheDocument();
        await waitForElementToBeRemoved(() => queryByText('Loading...'));

        const component = queryByText('Component render pass (1)');

        expect(component).toBeInTheDocument();

        rerender(
          <App phase={phase}>
            <LazySuspense fallback="Loading...">
              <LazyTestComponent renderPass={2} />
            </LazySuspense>
          </App>
        );

        expect(queryByText('Loading...')).not.toBeInTheDocument();
        expect(component).toBeInTheDocument();
        expect(component).toHaveTextContent('Component render pass (2)');
      });
    };

    describe('lazyForPaint', () => {
      const opts = {
        autoStart,
        lazyMethod: lazyForPaint,
      };

      beforeEach(() => {
        LooselyLazy.init({
          autoStart,
        });
      });

      describe('in the first phase', () => {
        createRenderTests({
          ...opts,
          phase: PHASE.PAINT,
        });

        createErrorTests({
          ...opts,
          phase: PHASE.PAINT,
        });
      });

      describe('in the next phase', () => {
        createRenderTests({
          ...opts,
          phase: PHASE.AFTER_PAINT,
        });
      });
    });

    describe('lazyAfterPaint', () => {
      const opts = {
        autoStart,
        lazyMethod: lazyAfterPaint,
      };

      beforeEach(() => {
        LooselyLazy.init({
          autoStart,
          manifest: {
            publicPath: '/',
            assets: {
              [lazyOptions.moduleId]: ['1.js', '2.js'],
            },
          },
        });
      });

      describe('in the first phase', () => {
        const fallbackTestMessage = autoStart
          ? 'renders the fallback when a higher priority component is also rendered'
          : 'renders the fallback';

        it(fallbackTestMessage, async () => {
          await testFallbackRender({
            ...opts,
            phase: PHASE.PAINT,
          });
        });

        if (autoStart) {
          createRenderTests({
            ...opts,
            phase: PHASE.PAINT,
          });
        }

        it('prefetches the component ahead of require', async () => {
          const LazyTestComponent = lazyAfterPaint(
            createClientLoader(),
            lazyOptions
          );

          render(
            <LazySuspense fallback="Loading...">
              <LazyTestComponent />
            </LazySuspense>
          );

          expect(document.head).toMatchInlineSnapshot(`
            <head>
              <link
                href="/1.js"
                rel="prefetch"
              />
              <link
                href="/2.js"
                rel="prefetch"
              />
            </head>
          `);
        });

        it('cleans up the inserted link tags when the component unmounts', async () => {
          const LazyTestComponent = lazyAfterPaint(
            createClientLoader(),
            lazyOptions
          );

          const { unmount } = render(
            <LazySuspense fallback="Loading...">
              <LazyTestComponent />
            </LazySuspense>
          );

          unmount();

          expect(document.head).toMatchInlineSnapshot(`<head />`);
        });
      });

      describe('in the next phase', () => {
        createRenderTests({
          ...opts,
          phase: PHASE.AFTER_PAINT,
        });

        createErrorTests({
          ...opts,
          phase: PHASE.AFTER_PAINT,
        });
      });
    });

    describe('lazy', () => {
      const opts = {
        autoStart,
        lazyMethod: lazy,
      };

      describe('in the first phase', () => {
        createRenderTests({
          ...opts,
          phase: PHASE.PAINT,
        });

        createErrorTests({
          ...opts,
          phase: PHASE.PAINT,
        });
      });

      describe('in the next phase', () => {
        createRenderTests({
          ...opts,
          phase: PHASE.AFTER_PAINT,
        });
      });
    });

    it('supports imperative preloading with auto priority', async () => {
      LooselyLazy.init({
        autoStart,
        manifest: {
          publicPath: '/',
          assets: {
            [lazyOptions.moduleId]: ['1.js'],
          },
        },
      });

      const LazyTestComponent = lazyAfterPaint(
        createClientLoader(),
        lazyOptions
      );

      LazyTestComponent.preload();

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/1.js"
            rel="prefetch"
          />
        </head>
      `);
    });

    it('supports imperative preloading with provided priority', async () => {
      LooselyLazy.init({
        autoStart,
        manifest: {
          publicPath: '/',
          assets: {
            [lazyOptions.moduleId]: ['1.js'],
          },
        },
      });

      const LazyTestComponent = lazyAfterPaint(
        createClientLoader(),
        lazyOptions
      );

      LazyTestComponent.preload(PRIORITY.HIGH);

      expect(document.head).toMatchInlineSnapshot(`
        <head>
          <link
            href="/1.js"
            rel="preload"
          />
        </head>
      `);
    });
  });
});
