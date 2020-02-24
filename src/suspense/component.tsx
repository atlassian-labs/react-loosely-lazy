import React, { Component, Suspense } from 'react';
import { SETTINGS } from '../constants';
import { LazySuspenseContext } from './context';

export class LazySuspense extends Component<any, any> {
  state = {
    // Used on server to render fallback down the tree
    fallback: this.props.fallback,
    // Used on client to replace fallback with magic input
    setFallback: (f: any) => {
      this.hydrationFallback = f;
    },
  };

  hydrationFallback = null;

  DynamicFallback = ({ children }: any) => {
    return children(this.hydrationFallback || this.props.fallback);
  };

  renderFallback() {
    // Use render prop component to allow switch to hydration fallback
    return (
      <this.DynamicFallback>{(fallback: any) => fallback}</this.DynamicFallback>
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
        <Suspense fallback={this.renderFallback()}>
          {this.props.children}
        </Suspense>
      </LazySuspenseContext.Provider>
    );
  }

  render() {
    return SETTINGS.IS_SERVER ? this.renderServer() : this.renderClient();
  }
}
