import { Component, ComponentType, ReactNode } from 'react';

export const createDefaultServerImport = ({
  DefaultComponent,
  NamedComponent,
}: {
  DefaultComponent: ComponentType<void>;
  NamedComponent?: ComponentType<void>;
}) => {
  return NamedComponent
    ? { default: DefaultComponent, TestComponent: NamedComponent }
    : { default: DefaultComponent };
};

export const createNamedServerImport = ({
  DefaultComponent,
  NamedComponent,
}: {
  DefaultComponent?: ComponentType<void>;
  NamedComponent: ComponentType<void>;
}) => {
  const _temp = DefaultComponent
    ? { default: DefaultComponent, TestComponent: NamedComponent }
    : { TestComponent: NamedComponent };
  const _temp2 = ({ TestComponent }: { TestComponent: ComponentType<void> }) =>
    TestComponent;

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
