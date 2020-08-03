import { Component, ReactNode } from 'react';

export const createDefaultServerImport = <C1, C2>({
  DefaultComponent,
  NamedComponent,
}: {
  DefaultComponent: C1;
  NamedComponent?: C2;
}) => {
  return NamedComponent
    ? { default: DefaultComponent, TestComponent: NamedComponent }
    : { default: DefaultComponent };
};

export const createNamedServerImport = <C1, C2>({
  DefaultComponent,
  NamedComponent,
}: {
  DefaultComponent?: C1;
  NamedComponent: C2;
}) => {
  const _temp = DefaultComponent
    ? { default: DefaultComponent, TestComponent: NamedComponent }
    : { TestComponent: NamedComponent };
  const _temp2 = ({ TestComponent }: { TestComponent: C2 }) => TestComponent;

  return _temp2(_temp);
};

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
