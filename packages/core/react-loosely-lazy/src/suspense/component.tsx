import React, { Component, Suspense, useLayoutEffect } from 'react';
import type { FunctionComponent } from 'react';

import { getConfig, MODE } from '../config';
import { LazySuspenseContext } from './context';
import { Fallback, LazySuspenseContextType, LazySuspenseProps } from './types';

type LazySuspenseState = LazySuspenseContextType;

type DynamicFallbackProps = {
  children(fallback: Fallback): any;
};

/**
 * This component implements a multi step system in order to be consumed on SSR
 * and still allow hydration and render a suspense boundary without having React
 * throw away the SSR content or complaining that the html code does not match.
 *
 * Most of the behaciour is implemented by communicating via context with the
 * lazy child. The lazy component is indeed responsible of collecting its own
 * SSR output and let this suspense alternative render it as fallback.
 *
 * To be clear, it does not render Suspense on the server: it only renders
 * a context provider in order to pass the fallback down to the child being
 * rendered if the lazy component is not there.
 *
 * Then on the client, during hydration, it renders the same provider with
 * two children: the first is the real Suspense component, that renders
 * the lazy child, catching any promise being thrown and wait; the second
 * is the hydration compliant component: it maintains SSR content until
 * the suspended promise is resolved.
 *
 * So during this step, if there is SSR content Suspense renders null and
 * the hydration fallback is rendered as sibling. If not, the lazy child
 * will signal to render the fallback prop, removing the hydration fallback.
 *
 * Once the suspended promise is resolved, Suspense will remove its own
 * fallback but will also tell LazySuspense to get rid of the hydration one.
 *
 */
export class LazySuspense extends Component<
  LazySuspenseProps,
  LazySuspenseState
> {
  state = {
    // Used on server to render fallback down the tree
    fallback: this.props.fallback,
    // Used on client to replace fallback with magic input
    setFallback: (fallback: Fallback) => {
      if (this.hydrationFallback === fallback) return;
      this.hydrationFallback = fallback;
    },
  };

  private hydrationFallback: Fallback = null;

  constructor(props: LazySuspenseProps) {
    super(props);
    this.DynamicFallback.displayName = 'DynamicFallback';
  }

  shouldComponentUpdate() {
    // This is a workaround to prevent Suspense during hydration
    // from switching to the fallback if a re-render occurs
    // https://github.com/facebook/react/issues/22692
    return this.hydrationFallback ? false : true;
  }

  private DynamicFallback: FunctionComponent<DynamicFallbackProps> = ({
    children,
  }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      return () => {
        // the effect cleanup is called by the Suspense boundary itself
        // when both Lazy AND the eventual promises thrown are done
        // so Suspense will re-render with actual content and we remove
        // the hydration fallback at the same time
        this.state.setFallback(this.hydrationFallback);
      };
    }, []);

    return children(this.hydrationFallback || this.props.fallback);
  };

  private renderFallback() {
    if (getConfig().mode === MODE.RENDER) {
      const { DynamicFallback } = this;

      // Use render prop component to allow switch to hydration fallback
      return (
        <DynamicFallback>{(fallback: Fallback) => fallback}</DynamicFallback>
      );
    }

    return this.props.fallback;
  }

  render() {
    return (
      <LazySuspenseContext.Provider value={this.state}>
        <Suspense fallback={this.renderFallback()}>
          {this.props.children}
        </Suspense>
      </LazySuspenseContext.Provider>
    );
  }
}
