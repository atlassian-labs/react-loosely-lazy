import React, { ComponentType } from 'react';
import { render, waitForElementToBeRemoved } from '@testing-library/react';
import { PHASE, PRIORITY } from '../../constants';
import { LooselyLazy } from '../../init';
import { LazySuspense } from '../../suspense';
import { isNodeEnvironment } from '../../utils';

import { lazyForPaint, lazyAfterPaint, lazy } from '..';
import {
  App,
  createClientLoader,
  createErrorTests,
  testFallbackRender,
  testRender,
  TestRenderOptions,
} from './utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: jest.fn(),
}));

describe('lazy* on the client', () => {
  const lazyOptions = {
    moduleId: '@foo/bar',
  };

  afterEach(() => {
    LooselyLazy.init({}); // reset settings
    document.head.innerHTML = ''; // reset head
  });

  beforeEach(() => {
    (isNodeEnvironment as any).mockImplementation(() => false);
  });

  const createRenderTests = (
    opts: Required<Pick<TestRenderOptions, 'lazyMethod' | 'phase'>>
  ) => {
    const { lazyMethod, phase } = opts;

    it('renders the default component when there is only a default export', async () => {
      await testRender({
        loader: () =>
          Promise.resolve({ default: () => <div>Default Component </div> }),
        text: 'Default Component',
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

    it('re-renders the component correctly', async () => {
      const TestComponent = () => <div>Component</div>;
      const LazyTestComponent = lazyMethod(() =>
        Promise.resolve({ default: TestComponent })
      );

      const { getByText, queryByText, rerender } = render(
        <App phase={phase}>
          <LazySuspense fallback="Loading...">
            <LazyTestComponent />
          </LazySuspense>
        </App>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));

      const component = getByText('Component');

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
      lazyMethod: lazyForPaint,
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

  describe('lazyAfterPaint', () => {
    const opts = {
      lazyMethod: lazyAfterPaint,
    };

    describe('in the first phase', () => {
      beforeEach(() => {
        LooselyLazy.init({
          manifest: {
            publicPath: '/',
            assets: {
              [lazyOptions.moduleId]: ['1.js', '2.js'],
            },
          },
        });
      });

      it('renders the fallback', async () => {
        await testFallbackRender({
          ...opts,
          phase: PHASE.PAINT,
        });
      });

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
      manifest: {
        publicPath: '/',
        assets: {
          [lazyOptions.moduleId]: ['1.js'],
        },
      },
    });

    const LazyTestComponent = lazyAfterPaint(createClientLoader(), lazyOptions);

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
      manifest: {
        publicPath: '/',
        assets: {
          [lazyOptions.moduleId]: ['1.js'],
        },
      },
    });

    const LazyTestComponent = lazyAfterPaint(createClientLoader(), lazyOptions);

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
