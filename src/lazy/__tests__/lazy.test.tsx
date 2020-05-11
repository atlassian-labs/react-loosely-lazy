import React from 'react';
import { lazyForPaint } from '..';
import { LazySuspense } from '../../suspense';
import { isNodeEnvironment, tryRequire } from '../../utils';
import { act, render } from '@testing-library/react';
import { nextTick } from '../../__tests__/utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  isNodeEnvironment: jest.fn(),
  tryRequire: jest.fn(),
}));

describe('lazy', () => {
  const mockModuleId = '@foo/bar';
  describe('LazyComponent', () => {
    (isNodeEnvironment as any).mockImplementation(() => true);

    const lazyComponent = lazyForPaint(
      // @ts-ignore - mocking import()
      () => Promise.resolve({ default: mockModuleId }),
      {
        getCacheId: () => '',
        moduleId: mockModuleId,
      }
    );

    describe('getBundleUrl', () => {
      it('should find the module file in the supplied manifest', () => {
        const publicPath = 'https://cdn.com/@foo/bar.js';
        const mockManifest = {
          '@foo/bar': {
            file: '',
            id: 0,
            name: '',
            publicPath,
          },
        };

        expect(lazyComponent.getBundleUrl(mockManifest)).toEqual(publicPath);
      });
    });
  });

  describe('createComponentClient', () => {
    (isNodeEnvironment as any).mockImplementation(() => false);
    it('should handle named exports', async () => {
      (tryRequire as any).mockImplementation(() => false);
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
  });
});
