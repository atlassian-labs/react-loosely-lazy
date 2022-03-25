import React, { memo, ComponentType, FunctionComponent } from 'react';
import { LazySuspense } from 'react-loosely-lazy';

import { Result } from './result';
import { Progress } from './progress';
import { isServer } from '../../utils';

type Props = {
  components: {
    WithSSR?: ComponentType<unknown>;
    WithoutSSR?: ComponentType<unknown>;
    Wrapper?: ComponentType<any>;
  };
  currentStep?: string;
  step: string;
  title: string;
};

const DefaultWrapper: FunctionComponent<any> = p => p.children;

export const Section = memo(
  ({
    components: { WithSSR, WithoutSSR, Wrapper = DefaultWrapper },
    currentStep,
    step,
    title,
  }: Props) => (
    <>
      <h3>
        <Progress step={step} /> {title} components
      </h3>
      <Wrapper until={(currentStep || '').includes(step)}>
        {WithSSR != null && (
          <LazySuspense fallback={<Result isFallback hasSsr />}>
            <WithSSR />
          </LazySuspense>
        )}
        {WithoutSSR != null && (
          <LazySuspense fallback={<Result isFallback />}>
            {/* given use renderToString, we fake SSR fallback render */}
            {isServer() ? <Result isFallback /> : <WithoutSSR />}
          </LazySuspense>
        )}
      </Wrapper>
    </>
  )
);
