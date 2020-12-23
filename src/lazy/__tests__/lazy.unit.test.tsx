import React from 'react';
import { render, waitForElementToBeRemoved } from '@testing-library/react';
import { lazyForPaint } from '..';
import { LooselyLazy } from '../../init';
import { LazySuspense } from '../../suspense';
import { isNodeEnvironment } from '../../utils';
import { LoaderError } from '../errors/loader-error';
import {
  createDefaultServerImport,
  createNamedServerImport,
  ErrorBoundary,
} from './utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: jest.fn(),
}));

describe('lazy', () => {
  const lazyOptions = {
    moduleId: '@foo/bar',
  };

  let restoreConsoleErrors: any = jest.fn();
  const silenceConsoleErrors = () => {
    restoreConsoleErrors = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn);
  };

  beforeEach(() => {
    LooselyLazy.init({ manifest: {} });
    restoreConsoleErrors = jest.fn();
  });

  afterEach(() => {
    restoreConsoleErrors();
  });

  const testErrorBubbling = async (ssr: boolean) => {
    const error = new Error('ChunkLoadError');
    const moduleId = '@foo/bar';
    const loaderError = new LoaderError(moduleId, error);
    const LazyComponent = lazyForPaint(
      () => (ssr ? require('404') : Promise.reject(error)),
      {
        ...lazyOptions,
        moduleId,
        ssr,
      }
    );

    const onError = jest.fn();

    silenceConsoleErrors();

    const { queryByText } = render(
      <ErrorBoundary
        fallback={<div>Component failed to load</div>}
        onError={onError}
      >
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </LazySuspense>
      </ErrorBoundary>
    );

    if (ssr) {
      expect(queryByText('Loading...')).not.toBeInTheDocument();
    } else {
      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));
    }

    expect(queryByText('Component failed to load')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(loaderError);
  };

  describe('on the server', () => {
    beforeEach(() => {
      (isNodeEnvironment as any).mockImplementation(() => true);
    });

    describe('getAssetUrls', () => {
      const createComponent = (moduleId: string) =>
        lazyForPaint(
          () => createDefaultServerImport({ DefaultComponent: () => <div /> }),
          {
            ...lazyOptions,
            moduleId,
          }
        );

      it('should return undefined when given an empty manifest', () => {
        const manifest = {};
        LooselyLazy.init({ manifest });
        const TestComponent = createComponent('./src/app/foo.tsx');
        expect(TestComponent.getAssetUrls()).toBeUndefined();
      });

      it('should return undefined when given a manifest that does not contain the component moduleId', () => {
        const manifest = {
          './src/app/bar.tsx': ['https://cdn.com/async-bar.js'],
        };
        LooselyLazy.init({ manifest });
        const TestComponent = createComponent('./src/app/foo.tsx');
        expect(TestComponent.getAssetUrls()).toBeUndefined();
      });

      it('should return the module public paths when given a manifest that contains the component moduleId', () => {
        const publicPath = 'https://cdn.com/async-foo.js';
        const moduleId = './src/app/foo.tsx';
        const manifest = {
          [`${moduleId}`]: [publicPath],
        };
        LooselyLazy.init({ manifest });
        const TestComponent = createComponent(moduleId);
        expect(TestComponent.getAssetUrls()).toEqual([publicPath]);
      });
    });

    it('should render the default component correctly when there is only a default export', async () => {
      const DefaultComponent = () => <div>Component</div>;
      const LazyTestComponent = lazyForPaint(
        () => createDefaultServerImport({ DefaultComponent }),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('Component')).toBeInTheDocument();
    });

    it('should render the named component correctly when there is only a named export', () => {
      const NamedComponent = () => <div>Component</div>;
      const LazyTestComponent = lazyForPaint(
        () => createNamedServerImport({ NamedComponent }),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('Component')).toBeInTheDocument();
    });

    it('should render the default component correctly when there are default and named exports', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      const NamedComponent = () => <div>Named Component</div>;
      const LazyTestComponent = lazyForPaint(
        () => createDefaultServerImport({ DefaultComponent, NamedComponent }),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('Default Component')).toBeInTheDocument();
      expect(queryByText('Named Component')).not.toBeInTheDocument();
    });

    it('should render the named component correctly when there are default and named exports', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      const NamedComponent = () => <div>Named Component</div>;
      const LazyTestComponent = lazyForPaint(
        () => createNamedServerImport({ DefaultComponent, NamedComponent }),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('Default Component')).not.toBeInTheDocument();
      expect(queryByText('Named Component')).toBeInTheDocument();
    });

    it('should bubble a LoaderError in the component lifecycle when the loader fails', () => {
      return testErrorBubbling(true);
    });
  });

  describe('on the client', () => {
    beforeEach(() => {
      (isNodeEnvironment as any).mockImplementation(() => false);
    });

    it('should render the default component correctly when there is only a default export', async () => {
      const DefaultComponent = () => <div>Component</div>;
      const LazyTestComponent = lazyForPaint(
        () => Promise.resolve({ default: DefaultComponent }),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));
      expect(queryByText('Component')).toBeInTheDocument();
    });

    it('should render the named component correctly when there is only a named export', async () => {
      const NamedComponent = () => <div>Component</div>;
      const LazyTestComponent = lazyForPaint(
        // @ts-ignore - mocking import()
        () => Promise.resolve({ NamedComponent }).then(m => m.NamedComponent),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));
      expect(queryByText('Component')).toBeInTheDocument();
    });

    it('should render the default component correctly when there are default and named exports', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      const NamedComponent = () => <div>Named Component</div>;
      const LazyTestComponent = lazyForPaint(
        // @ts-ignore - mocking import()
        () => Promise.resolve({ default: DefaultComponent, NamedComponent }),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));
      expect(queryByText('Default Component')).toBeInTheDocument();
      expect(queryByText('Named Component')).not.toBeInTheDocument();
    });

    it('should render the named component correctly when there are default and named exports', async () => {
      const DefaultComponent = () => <div>Default Component</div>;
      const NamedComponent = () => <div>Named Component</div>;
      const LazyTestComponent = lazyForPaint(
        () =>
          // @ts-ignore - mocking import()
          Promise.resolve({ default: DefaultComponent, NamedComponent }).then(
            m => m.NamedComponent
          ),
        lazyOptions
      );

      const { queryByText } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));
      expect(queryByText('Default Component')).not.toBeInTheDocument();
      expect(queryByText('Named Component')).toBeInTheDocument();
    });

    it('should re-render the component correctly', async () => {
      const TestComponent = () => <div>Component</div>;
      const LazyTestComponent = lazyForPaint(
        () => Promise.resolve({ default: TestComponent }),
        lazyOptions
      );

      const { getByText, queryByText, rerender } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));

      const component = getByText('Component');

      expect(component).toBeInTheDocument();

      rerender(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </LazySuspense>
      );

      expect(component).toBeInTheDocument();
    });

    it('should re-render the component correctly when it is updated', async () => {
      const TestComponent = ({ renderPass }: { renderPass: number }) => (
        <div>Component render pass ({renderPass})</div>
      );
      const fooModule = { default: TestComponent };

      const LazyTestComponent = lazyForPaint(
        () => Promise.resolve(fooModule),
        lazyOptions
      );

      const { queryByText, rerender } = render(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent renderPass={1} />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).toBeInTheDocument();
      await waitForElementToBeRemoved(() => queryByText('Loading...'));

      const component = queryByText('Component render pass (1)');

      expect(component).toBeInTheDocument();

      rerender(
        <LazySuspense fallback={<div>Loading...</div>}>
          <LazyTestComponent renderPass={2} />
        </LazySuspense>
      );

      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(component).toBeInTheDocument();
      expect(component).toHaveTextContent('Component render pass (2)');
    });

    it('should bubble a LoaderError in the component lifecycle when the loader fails', () => {
      return testErrorBubbling(false);
    });
  });
});
