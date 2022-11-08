import React from 'react';
import { insertLinkTag } from '../../lazy/preload/utils';
import { LazySuspense } from '../../suspense';
import * as profiler from '../index';
import { render } from '@testing-library/react';
import { LooselyLazy } from '../../init';
import { lazyForPaint } from '../../lazy';

const nextTick = async () => new Promise(resolve => setTimeout(resolve, 0));

describe('profiler', () => {
  const globalOnLoadStart = jest.fn();
  const globalOnLoadComplete = jest.fn();

  beforeEach(() => {
    profiler.setGlobalReactLooselyLazyProfilerInstance({
      onLoadStart: globalOnLoadStart,
      onLoadComplete: globalOnLoadComplete,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('global profiler', () => {
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
    const contextOnLoadStart = jest.fn();
    const contextOnLoadComplete = jest.fn();

    beforeEach(() => {
      LooselyLazy.init({});
    });

    it('should collect start and end times from client component', async () => {
      const context = {
        onLoadStart: contextOnLoadStart,
        onLoadComplete: contextOnLoadComplete,
      };

      const TestComponent = () => <div>A component</div>;
      const LazyTestComponent = lazyForPaint(
        () => Promise.resolve({ default: TestComponent }),
        {
          moduleId: 'success module',
        }
      );

      render(
        <profiler.ProfilerContext.Provider value={context}>
          <LazySuspense fallback={null}>
            <LazyTestComponent />
          </LazySuspense>
        </profiler.ProfilerContext.Provider>
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
        onLoadStart: contextOnLoadStart,
        onLoadComplete: contextOnLoadComplete,
      };

      const LazyFailComponent = lazyForPaint(
        () => Promise.reject('Module failed to load'),
        {
          moduleId: 'fail module',
        }
      );

      render(
        <profiler.ProfilerContext.Provider value={context}>
          <LazySuspense fallback={null}>
            <LazyFailComponent />
          </LazySuspense>
        </profiler.ProfilerContext.Provider>
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
