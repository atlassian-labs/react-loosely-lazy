import React from 'react';
import { lazyForPaint } from '..';
import { LazySuspense } from '../../suspense';
import { isNodeEnvironment, tryRequire } from '../../utils';
import { act, render } from '@testing-library/react';
import { nextTick } from '../../__tests__/utils';
import { ErrorBoundary } from './utils';
import { LoaderError } from '../errors/loader-error';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: jest.fn(),
  tryRequire: jest.fn(),
}));

describe('lazy', () => {
  const mockModuleId = '@foo/bar';

  let restoreConsoleErrors: any = jest.fn();
  const silenceConsoleErrors = () => {
    restoreConsoleErrors = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn);
  };

  beforeEach(() => {
    restoreConsoleErrors = jest.fn();
  });

  afterEach(() => {
    restoreConsoleErrors();
  });

  const testErrorBubbling = async (ssr: boolean) => {
    const error = new Error('ChunkLoadError');
    const loaderError = new LoaderError('foo', error);
    const LazyComponent = lazyForPaint(
      () => (ssr ? require(mockModuleId) : Promise.reject(error)),
      {
        getCacheId: () => 'foo',
        moduleId: mockModuleId,
        ssr,
      }
    );

    const onError = jest.fn();
    let queryByText: any;

    silenceConsoleErrors();
    await act(async () => {
      const result = render(
        <ErrorBoundary
          fallback={<div>Component failed to load</div>}
          onError={onError}
        >
          <LazySuspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </LazySuspense>
        </ErrorBoundary>
      );
      queryByText = result.queryByText;
      await nextTick();
    });

    expect(queryByText!('Component failed to load')).not.toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(loaderError);
  };

  describe('on the server', () => {
    beforeEach(() => {
      (isNodeEnvironment as any).mockImplementation(() => true);
      (tryRequire as any).mockImplementation(() => false);
    });

    it('should return the module public path in the supplied manifest when calling getBundleUrl', () => {
      const publicPath = 'https://cdn.com/@foo/bar.js';
      const manifest = {
        [mockModuleId]: {
          file: '',
          id: 0,
          name: '',
          publicPath,
        },
      };
      const LazyComponent = lazyForPaint(
        // @ts-ignore - mocking import()
        () => Promise.resolve({ default: 'yolo' }),
        {
          getCacheId: () => '',
          moduleId: mockModuleId,
        }
      );

      expect(LazyComponent.getBundleUrl(manifest)).toEqual(publicPath);
    });

    it('should bubble a LoaderError in the component lifecycle when the loader fails', () => {
      return testErrorBubbling(true);
    });
  });

  describe('on the client', () => {
    beforeEach(() => {
      (isNodeEnvironment as any).mockImplementation(() => false);
      (tryRequire as any).mockImplementation(() => false);
    });

    it('should handle named exports', async () => {
      const MockComponent = jest.fn(() => <div />);
      const MockFallback = () => <div />;
      const MyAsync = lazyForPaint(
        // @ts-ignore - mocking import()
        () => Promise.resolve({ MockComponent }).then(m => m.MockComponent),
        {
          getCacheId: () => '',
          moduleId: mockModuleId,
        }
      );

      await act(async () => {
        render(
          <LazySuspense fallback={<MockFallback />}>
            <MyAsync />
          </LazySuspense>
        );

        await nextTick();
      });

      expect(MockComponent).toHaveBeenCalled();
    });

    it('should bubble a LoaderError in the component lifecycle when the loader fails', () => {
      return testErrorBubbling(false);
    });
  });
});
