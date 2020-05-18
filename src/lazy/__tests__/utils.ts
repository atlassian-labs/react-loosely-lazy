import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { fallback: ReactNode; onError: (error: Error) => void },
  { error: Error | void }
> {
  state = {
    error: undefined,
  };

  componentDidCatch(error: Error) {
    this.props.onError(error);
    this.setState({ error });
  }

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (!error) {
      return children;
    }

    return fallback;
  }
}
