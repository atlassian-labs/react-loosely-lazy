import { act, render, waitForElementToBeRemoved } from '@testing-library/react';
import React, { Component, ComponentType, ReactNode, useEffect } from 'react';

import { PHASE } from '../../constants';
import { LooselyLazy } from '../../init';
import { useLazyPhase } from '../../phase';
import { LazySuspense } from '../../suspense';

import { isLoaderError, lazyAfterPaint, lazyForPaint } from '../';
import { Loader } from '../loader';
import { isNodeEnvironment } from '../../utils';

export const createClientLoader = ({
  text = 'Default Component',
}: {
  text?: string;
} = {}) => {
  const DefaultComponent = () => <div>{text}</div>;

  return () => Promise.resolve({ default: DefaultComponent });
};

export const createServerLoader = ({ text = 'Default Component' } = {}) => {
  const DefaultComponent = () => <div>{text}</div>;

  return () => createDefaultServerImport({ DefaultComponent });
};

export const createDefaultServerImport = <C1, C2>({
  DefaultComponent,
  NamedComponent,
}: {
  DefaultComponent: C1;
  NamedComponent?: C2;
}) => {
  return NamedComponent
    ? { default: DefaultComponent, TestComponent: NamedComponent }
    : { default: DefaultComponent };
};

export const createNamedServerImport = <C1, C2>({
  DefaultComponent,
  NamedComponent,
}: {
  DefaultComponent?: C1;
  NamedComponent: C2;
}) => {
  const _temp = DefaultComponent
    ? { default: DefaultComponent, TestComponent: NamedComponent }
    : { TestComponent: NamedComponent };
  const _temp2 = ({ TestComponent }: { TestComponent: C2 }) => TestComponent;

  return _temp2(_temp);
};

export type ErrorBoundaryProps = {
  fallback: ReactNode;
  onError?: (error: Error) => void;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  { error: Error | void }
> {
  state = {
    error: undefined,
  };

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
    this.setState({ error });
  }

  retry = () => {
    this.setState({ error: undefined });
  };

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (!error) {
      return children;
    }

    return (
      <>
        {fallback}
        <button onClick={this.retry}>Retry</button>
      </>
    );
  }
}

export type TestErrorBubblingOptions = {
  autoStart: boolean;
  lazyMethod: typeof lazyForPaint;
  phase?: number;
};

export const createErrorTests = ({
  autoStart = false,
  lazyMethod,
  phase = PHASE.PAINT,
}: TestErrorBubblingOptions) => {
  describe('when the loader fails', () => {
    let consoleError: jest.SpyInstance;
    const clientError = new Error('ChunkLoadError');
    const preloadAttempts = lazyMethod === lazyAfterPaint ? 1 : 0;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn);
      LooselyLazy.init({
        autoStart,
        retry: 0,
      });

      jest.useFakeTimers();
    });

    afterEach(() => {
      consoleError.mockRestore();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    if (!isNodeEnvironment()) {
      it('does not retry when the global retry option is set to 0', async () => {
        const loader = jest.fn(() => Promise.reject(clientError));
        const LazyTestComponent = lazyMethod(loader);

        const { queryByText } = render(
          <ErrorBoundary fallback="Component failed to load...">
            <App phase={phase}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </App>
          </ErrorBoundary>
        );

        expect(queryByText('Loading...')).toBeInTheDocument();
        await waitForElementToBeRemoved(() => queryByText('Loading...'));

        expect(queryByText('Component failed to load...')).toBeInTheDocument();
        expect(loader).toHaveBeenCalledTimes(1 + preloadAttempts);
      });

      it('does not update state after the component has already unmounted', async () => {
        type Reject = (reason?: Error) => void;
        let rejectLoader: Reject = () => {
          throw new Error('Loader rejection must be overridden');
        };

        const promise = new Promise((_, reject) => {
          rejectLoader = reject;
        });

        const loader: jest.Mock = jest.fn(() => promise);
        const LazyTestComponent = lazyMethod(loader);

        const { queryByText, unmount } = render(
          <ErrorBoundary fallback="Component failed to load...">
            <App phase={phase}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </App>
          </ErrorBoundary>
        );

        expect(queryByText('Loading...')).toBeInTheDocument();

        await act(async () => {
          await jest.runAllTicks();
        });

        // Make sure the loader has been called so that it can reject later
        expect(loader).toHaveBeenCalledTimes(1 + preloadAttempts);

        act(() => {
          unmount();
          rejectLoader(clientError);
        });

        await promise.catch(() => {
          // We expect an error...
        });

        await act(async () => {
          await jest.runAllTimers();
        });

        expect(consoleError).not.toHaveBeenCalled();
      });
    }

    it('bubbles a loader error in the component lifecycle', async () => {
      const LazyTestComponent = lazyMethod(
        () =>
          isNodeEnvironment() ? require('404') : Promise.reject(clientError),
        {
          ssr: true,
        }
      );

      const errors: Error[] = [];
      const onError = (error: Error) => {
        errors.push(error);
      };

      const { queryByText } = render(
        <ErrorBoundary fallback="Component failed to load..." onError={onError}>
          <App phase={phase}>
            <LazySuspense fallback="Loading...">
              <LazyTestComponent />
            </LazySuspense>
          </App>
        </ErrorBoundary>
      );

      if (isNodeEnvironment()) {
        expect(queryByText('Loading...')).not.toBeInTheDocument();
      } else {
        expect(queryByText('Loading...')).toBeInTheDocument();
        await waitForElementToBeRemoved(() => queryByText('Loading...'));
      }

      expect(queryByText('Component failed to load...')).toBeInTheDocument();
      expect(
        errors.map(error => ({
          error,
          isLoaderError: isLoaderError(error),
        }))
      ).toEqual([
        {
          error: isNodeEnvironment()
            ? expect.objectContaining({
                code: 'MODULE_NOT_FOUND',
              })
            : clientError,
          isLoaderError: true,
        },
      ]);
    });
  });
};

export const App = ({
  children,
  phase,
}: {
  children: ReactNode;
  phase: number;
}) => {
  const { startNextPhase } = useLazyPhase();

  useEffect(() => {
    if (phase === PHASE.AFTER_PAINT) {
      startNextPhase();
    }
  }, [phase, startNextPhase]);

  return <>{children}</>;
};

export type TestRenderOptions = {
  lazyMethod: typeof lazyForPaint;
  loader?: Loader<ComponentType>;
  phase?: number;
  ssr?: boolean;
  text?: string;
};

export const testRender = async ({
  lazyMethod,
  loader,
  phase = PHASE.PAINT,
  ssr,
  text = 'Default Component',
}: TestRenderOptions) => {
  const LazyTestComponent = lazyMethod(loader ?? createClientLoader(), {
    ssr,
  });

  const { queryByText } = render(
    <App phase={phase}>
      <LazySuspense fallback="Loading...">
        <LazyTestComponent />
      </LazySuspense>
    </App>
  );

  if (isNodeEnvironment()) {
    expect(queryByText('Loading...')).not.toBeInTheDocument();
  } else {
    expect(queryByText('Loading...')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => queryByText('Loading...'));
  }

  expect(queryByText(text)).toBeInTheDocument();
};

export type TestFallbackRenderOptions = Omit<TestRenderOptions, 'text'> & {
  autoStart: boolean;
};

export const testFallbackRender = async ({
  autoStart,
  lazyMethod,
  loader,
  phase = PHASE.PAINT,
  ssr,
}: TestFallbackRenderOptions) => {
  const LazyTestComponent = lazyMethod(
    loader ?? isNodeEnvironment() ? createServerLoader() : createClientLoader(),
    ssr == null ? undefined : { ssr }
  );

  const LazyPaintComponent = lazyForPaint(
    loader ?? isNodeEnvironment()
      ? createServerLoader({ text: 'Paint Component' })
      : createClientLoader({ text: 'Paint Component' })
  );

  const { queryByText } = render(
    <App phase={phase}>
      {autoStart && lazyMethod === lazyAfterPaint && (
        <LazySuspense fallback="Loading paint...">
          <LazyPaintComponent />
        </LazySuspense>
      )}
      {/* TODO Eventually remove span, once matching works correctly */}
      <LazySuspense fallback={<span>Loading...</span>}>
        <LazyTestComponent />
      </LazySuspense>
    </App>
  );

  if (isNodeEnvironment()) {
    expect(queryByText('Loading...')).toBeInTheDocument();
  } else {
    expect(queryByText('Loading...')).toBeInTheDocument();
    if (autoStart) {
      await waitForElementToBeRemoved(() => queryByText('Loading...'));
      expect(queryByText('Default Component')).toBeInTheDocument();
    } else {
      await waitForElementToBeRemoved(() => queryByText('Loading...')).catch(
        () => {
          // We expect the loading state to remain, and this should timeout
        }
      );
      expect(queryByText('Default Component')).not.toBeInTheDocument();
    }
  }
};
