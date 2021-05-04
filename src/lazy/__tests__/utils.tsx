import { render, waitForElementToBeRemoved } from '@testing-library/react';
import React, { Component, ComponentType, ReactNode } from 'react';

import { PHASE } from '../../constants';
import { useLazyPhase } from '../../phase';
import { LazySuspense } from '../../suspense';

import { isLoaderError, lazyForPaint } from '../';
import { Loader } from '../loader';
import { isNodeEnvironment } from '../../utils';

export const createClientLoader = () => {
  const DefaultComponent = () => <div>Default Component</div>;

  return () => Promise.resolve({ default: DefaultComponent });
};

export const createServerLoader = () => {
  const DefaultComponent = () => <div>Default Component</div>;

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

class ErrorBoundary extends Component<
  { fallback: ReactNode; onError: (error: Error) => void },
  { error: Error | void }
> {
  state = {
    error: undefined,
  };

  componentDidCatch(error: Error) {
    this.props.onError(error);
    this.setState({ error });
  }

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (!error) {
      return children;
    }

    return fallback;
  }
}

export type TestErrorBubblingOptions = {
  lazyMethod: typeof lazyForPaint;
  phase?: number;
};

export const createErrorTests = ({
  lazyMethod,
  phase = PHASE.PAINT,
}: TestErrorBubblingOptions) => {
  it('bubbles a loader error in the component lifecycle when the loader fails', async () => {
    const clientError = new Error('ChunkLoadError');
    const moduleId = '@foo/bar';
    const LazyTestComponent = lazyMethod(
      () =>
        isNodeEnvironment() ? require('404') : Promise.reject(clientError),
      {
        moduleId,
        ssr: true,
      }
    );

    const errors: Error[] = [];
    const onError = (error: Error) => {
      errors.push(error);
    };

    const spy = jest.spyOn(console, 'error').mockImplementation(jest.fn);

    const { queryByText } = render(
      <ErrorBoundary
        fallback={<div>Component failed to load</div>}
        onError={onError}
      >
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

    spy.mockRestore();

    expect(queryByText('Component failed to load')).toBeInTheDocument();
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
};

export const App = ({
  children,
  phase,
}: {
  children: ReactNode;
  phase: number;
}) => {
  const { startNextPhase } = useLazyPhase();

  if (phase === PHASE.AFTER_PAINT) {
    startNextPhase();
  }

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

export type TestFallbackRenderOptions = Omit<TestRenderOptions, 'text'>;

export const testFallbackRender = async ({
  lazyMethod,
  loader,
  phase = PHASE.PAINT,
  ssr,
}: TestFallbackRenderOptions) => {
  const LazyTestComponent = lazyMethod(
    loader ?? isNodeEnvironment() ? createServerLoader() : createClientLoader(),
    ssr == null ? undefined : { ssr }
  );

  const { queryByText } = render(
    <App phase={phase}>
      <LazySuspense fallback="Loading...">
        <LazyTestComponent />
      </LazySuspense>
    </App>
  );

  if (isNodeEnvironment()) {
    expect(queryByText('Loading...')).toBeInTheDocument();
  } else {
    expect(queryByText('Loading...')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => queryByText('Loading...')).catch(
      () => {
        // We expect the loading state to remain, and this should timeout
      }
    );
    expect(queryByText('Default Component')).not.toBeInTheDocument();
  }
};
