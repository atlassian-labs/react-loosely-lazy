import React, { ReactNode, StrictMode } from 'react';
import { render } from '@testing-library/react';

import { LooselyLazy } from '../../init';
import { lazy, lazyForPaint } from '../../lazy';
import { createClientLoader } from '../../lazy/__tests__/test-utils';
import { LazySuspense } from '../../suspense';

import { LazyWait } from '../index';

jest.mock('../../utils', () => ({
  ...jest.requireActual<any>('../../utils'),
  isNodeEnvironment: () => false,
}));

describe('LazyWait', () => {
  let loader: jest.Mock;
  beforeEach(() => {
    loader = jest.fn(createClientLoader());
  });

  afterEach(() => {
    LooselyLazy.init({});
  });

  describe.each([
    ['lazyForPaint', lazyForPaint],
    ['lazy', lazy],
  ])('%s', (_, lazyMethod) => {
    const strictModeCalls = 1;

    describe('with a single closest', () => {
      it('does not load when until is false', () => {
        const LazyTestComponent = lazyMethod(loader);

        render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);
      });

      it('does not load a second time when until transitions to true', () => {
        const LazyTestComponent = lazyMethod(loader);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);

        rerender(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads when until is true', () => {
        const LazyTestComponent = lazyMethod(loader);

        render(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads when until transitions from false to true', () => {
        const LazyTestComponent = lazyMethod(loader);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads a second time when until transitions to true after the child unmounts', () => {
        const LazyTestComponent = lazyMethod(loader);

        type TransitionProps = {
          children: ReactNode;
          to: boolean;
        };

        const Transition = ({ children, to }: TransitionProps) => (
          <>{to && children}</>
        );

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={true}>
              <Transition to={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </Transition>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);

        rerender(
          <StrictMode>
            <LazyWait until={false}>
              {/* Keep mounted, and finish the animation */}
              <Transition to={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </Transition>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);

        rerender(
          <StrictMode>
            <LazyWait until={false}>
              {/* Done with animation, unmount */}
              <Transition to={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </Transition>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              {/* Load again */}
              <Transition to={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </Transition>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(2 + strictModeCalls * 2);
      });
    });

    describe('with multiple closest', () => {
      it('does not load when the closest until is false and the next closest until is true', () => {
        const LazyTestComponent = lazyMethod(loader);

        render(
          <StrictMode>
            <LazyWait until={true}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);
      });

      it('does not load when the closest until is true and the next closest until is false', () => {
        const LazyTestComponent = lazyMethod(loader);

        render(
          <StrictMode>
            <LazyWait until={false}>
              <LazyWait until={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);
      });

      it('does not load when the closest until transitions to true', () => {
        const LazyTestComponent = lazyMethod(loader);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={false}>
              <LazyWait until={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);
      });

      it('does not load when the next closest until transitions to true', () => {
        const LazyTestComponent = lazyMethod(loader);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);
      });

      it('loads when the closest and next closest until are true', () => {
        const LazyTestComponent = lazyMethod(loader);

        render(
          <StrictMode>
            <LazyWait until={true}>
              <LazyWait until={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads when the closest and next closest until transition to true sequentially', () => {
        const LazyTestComponent = lazyMethod(loader);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazyWait until={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads when the closest and next closest until transition to true in parallel', () => {
        const LazyTestComponent = lazyMethod(loader);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazyWait until={false}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazyWait until={true}>
                <LazySuspense fallback="Loading...">
                  <LazyTestComponent />
                </LazySuspense>
              </LazyWait>
            </LazyWait>
          </StrictMode>
        );

        expect(loader).toHaveBeenCalledTimes(1 + strictModeCalls);
      });
    });

    describe('with a sibling', () => {
      let loader1: jest.Mock;
      let loader2: jest.Mock;

      beforeEach(() => {
        loader1 = jest.fn(createClientLoader());
        loader2 = jest.fn(createClientLoader());
      });

      it('does not load either child when both until are false', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(0);
        expect(loader2).toHaveBeenCalledTimes(0);
      });

      it('loads only the first child when the first until is true', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        render(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(1 + strictModeCalls);
        expect(loader2).toHaveBeenCalledTimes(0);
      });

      it('loads only the second child when the second until is true', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(0);
        expect(loader2).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads both children when both until are true', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        render(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(1 + strictModeCalls);
        expect(loader2).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads only the first child when the first until transitions to true', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(0);
        expect(loader2).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(1 + strictModeCalls);
        expect(loader2).toHaveBeenCalledTimes(0);
      });

      it('loads only the second child when the second until transitions to true', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(0);
        expect(loader2).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(0);
        expect(loader2).toHaveBeenCalledTimes(1 + strictModeCalls);
      });

      it('loads both children when both until transition to true', () => {
        const LazyTestComponent1 = lazyMethod(loader1);
        const LazyTestComponent2 = lazyMethod(loader2);

        const { rerender } = render(
          <StrictMode>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={false}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(0);
        expect(loader2).toHaveBeenCalledTimes(0);

        rerender(
          <StrictMode>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent1 />
              </LazySuspense>
            </LazyWait>
            <LazyWait until={true}>
              <LazySuspense fallback="Loading...">
                <LazyTestComponent2 />
              </LazySuspense>
            </LazyWait>
          </StrictMode>
        );

        expect(loader1).toHaveBeenCalledTimes(1 + strictModeCalls);
        expect(loader2).toHaveBeenCalledTimes(1 + strictModeCalls);
      });
    });
  });
});
