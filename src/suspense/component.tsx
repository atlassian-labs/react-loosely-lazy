import React, { Component, Suspense } from 'react';
import { isNodeEnvironment } from '../utils';
import {
  Fallback,
  LazySuspenseContext,
  LazySuspenseContextType,
} from './context';

export type LazySuspenseProps = {
  fallback: Fallback;
};

type LazySuspenseState = LazySuspenseContextType;

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
      this.useSibling = Boolean(fallback);
      // Schedule an update so we force switch from the sibling tree
      // back to the suspense boundary
      this.forceUpdate();
    },
  };

  private hydrationFallback: Fallback = null;
  private useSibling = false;
  private mounted = false;

  componentDidMount() {
    this.mounted = true;
  }

  private DynamicFallback = ({
    children,
    sibling,
  }: {
    children(fallback: Fallback): Fallback;
    sibling: boolean;
  }) => {
    return (
      <>
        {sibling
          ? children(this.useSibling ? this.hydrationFallback : null)
          : children(this.useSibling ? null : this.props.fallback)}
      </>
    );
  };

  private renderFallback(sibling: boolean) {
    const { DynamicFallback } = this;

    // Use render prop component to allow switch to hydration fallback
    return (
      <DynamicFallback sibling={sibling}>
        {(fallback: Fallback) => fallback}
      </DynamicFallback>
    );
  }

  private renderServer() {
    return (
      <LazySuspenseContext.Provider value={this.state}>
        {this.props.children}
      </LazySuspenseContext.Provider>
    );
  }

  private renderClient() {
    return (
      <LazySuspenseContext.Provider value={this.state}>
        <Suspense fallback={this.renderFallback(false)}>
          {this.props.children}
        </Suspense>
        {(!this.mounted || this.useSibling) && this.renderFallback(true)}
      </LazySuspenseContext.Provider>
    );
  }

  render() {
    return isNodeEnvironment() ? this.renderServer() : this.renderClient();
  }
}
