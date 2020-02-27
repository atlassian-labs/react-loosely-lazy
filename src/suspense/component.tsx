import React, { Component, Suspense } from 'react';
import { SETTINGS } from '../constants';
import { LazySuspenseContext } from './context';

export class LazySuspense extends Component<any, any> {
  state = {
    // Used on server to render fallback down the tree
    fallback: this.props.fallback,
    // Used on client to replace fallback with magic input
    setFallback: (f: any) => {
      if (this.hydrationFallback === f) return;
      this.hydrationFallback = f;
      this.useSibling = Boolean(f);
      // Shedule an update so we force switch from the sibling tree
      // back to the suspense boundary
      this.forceUpdate();
    },
  };

  hydrationFallback = null;
  useSibling = false;
  mounted = false;

  componentDidMount() {
    this.mounted = true;
  }

  DynamicFallback = ({ children, sibling }: any) => {
    if (sibling) {
      return children(this.useSibling ? this.hydrationFallback : null);
    }
    return children(this.useSibling ? null : this.props.fallback);
  };

  renderFallback(v: boolean) {
    // Use render prop component to allow switch to hydration fallback
    return (
      <this.DynamicFallback sibling={v}>
        {(fallback: any) => fallback}
      </this.DynamicFallback>
    );
  }

  renderServer() {
    return (
      <LazySuspenseContext.Provider value={this.state}>
        {this.props.children}
      </LazySuspenseContext.Provider>
    );
  }

  renderClient() {
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
    return SETTINGS.IS_SERVER ? this.renderServer() : this.renderClient();
  }
}
