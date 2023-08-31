import React from 'react';
import { insertLinkTag } from '../../lazy/preload/utils';
import { LazySuspense } from '../../suspense';
import { GlobalReactLooselyLazyProfiler, ProfilerContext } from '../index';
import { render } from '@testing-library/react';
import { LooselyLazy } from '../../init';
import { lazyForPaint, PRIORITY } from '../../lazy';
import { preloadAsset } from '../../lazy/preload';
import { isNodeEnvironment } from '../../utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: jest.fn(),
}));

const nextTick = async () => new Promise(resolve => setTimeout(resolve, 0));

describe('profiler', () => {
  const globalOnPreload = jest.fn();
  const globalOnLoadStart = jest.fn();
  const globalOnLoadComplete = jest.fn();

  beforeEach(() => {
    GlobalReactLooselyLazyProfiler.current = {
      onPreload: globalOnPreload,
      onLoadStart: globalOnLoadStart,
      onLoadComplete: globalOnLoadComplete,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('global profiler', () => {
    beforeEach(() => {
      (isNodeEnvironment as any).mockImplementation(() => false);
    });

    it('should receive onPreload notification from preloadAsset', () => {
      preloadAsset({
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        loader: () => {},
        moduleId: 'module id',
        priority: PRIORITY.HIGH,
      });

      expect(globalOnPreload).toHaveBeenCalledWith('module id', PRIORITY.HIGH);
    });

    it('should collect start and end times from insertLinkTag', () => {
      const dispose = insertLinkTag('/example', 'preload');

      const tag = document.querySelector('link[href="/example"]');

      expect(globalOnLoadStart).toHaveBeenCalledTimes(1);
      expect(globalOnLoadStart).toHaveBeenCalledWith({
        identifier: '/example',
      });
      expect(globalOnLoadComplete).not.toHaveBeenCalled();

      expect(tag).not.toBeNull();
      tag?.dispatchEvent(new Event('onload'));
      dispose();

      expect(globalOnLoadStart).toHaveBeenCalledTimes(1);
      expect(globalOnLoadComplete).toHaveBeenCalledTimes(1);
      expect(globalOnLoadComplete).toHaveBeenCalledWith({
        identifier: '/example',
      });
    });

    it('should not collect end time when link has been disposed of before load completes', () => {
      const dispose = insertLinkTag('/example', 'preload');

      document.querySelector('link[href="/example"]');

      dispose();

      expect(globalOnLoadStart).toHaveBeenCalledTimes(1);
      expect(globalOnLoadComplete).not.toHaveBeenCalled();
    });
  });

  describe('context profiler', () => {
    const contextOnPreload = jest.fn();
    const contextOnLoadStart = jest.fn();
    const contextOnLoadComplete = jest.fn();

    beforeEach(() => {
      LooselyLazy.init({});
    });

    it('should collect start and end times from client component', async () => {
      const context = {
        current: {
          onPreload: contextOnPreload,
          onLoadStart: contextOnLoadStart,
          onLoadComplete: contextOnLoadComplete,
        },
      };

      const TestComponent = () => <div>A component</div>;
      const LazyTestComponent = lazyForPaint(
        () => Promise.resolve({ default: TestComponent }),
        {
          moduleId: 'success module',
        }
      );

      render(
        <ProfilerContext.Provider value={context}>
          <LazySuspense fallback={null}>
            <LazyTestComponent />
          </LazySuspense>
        </ProfilerContext.Provider>
      );

      expect(contextOnLoadStart).toHaveBeenCalledWith({
        identifier: 'success module',
      });
      expect(contextOnLoadComplete).not.toHaveBeenCalled();

      await nextTick();

      expect(contextOnLoadComplete).toHaveBeenCalledWith({
        identifier: 'success module',
      });
    });

    it('should not collect end time when component fails to load', async () => {
      const context = {
        current: {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onPreload: () => {},
          onLoadStart: contextOnLoadStart,
          onLoadComplete: contextOnLoadComplete,
        },
      };

      const loader = () =>
        Promise.reject(new Error('Failed to load module...'));
      const LazyFailComponent = lazyForPaint(loader, {
        moduleId: 'fail module',
      });

      render(
        <ProfilerContext.Provider value={context}>
          <LazySuspense fallback={null}>
            <LazyFailComponent />
          </LazySuspense>
        </ProfilerContext.Provider>
      );

      expect(contextOnLoadStart).toHaveBeenCalledWith({
        identifier: 'fail module',
      });
      expect(contextOnLoadComplete).not.toHaveBeenCalled();

      await nextTick();

      expect(contextOnLoadComplete).not.toHaveBeenCalled();
    });
  });
});
