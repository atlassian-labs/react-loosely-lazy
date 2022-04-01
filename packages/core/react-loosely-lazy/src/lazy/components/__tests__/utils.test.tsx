import React, { createContext } from 'react';
import { render } from '@testing-library/react';

import { useSubscription } from '../utils';
import { SubscriptionContextValue } from '../../types';
import { act } from 'react-dom/test-utils';

describe('useSubscription', () => {
  const createApp = ({ currentValue }) => {
    const load = jest.fn();

    const subscription = {
      subscribe: jest.fn(fn => {
        subscription.trigger = fn;

        return subscription.unsubscribe;
      }),
      trigger: null,
      unsubscribe: jest.fn(),
    };

    const context = createContext<SubscriptionContextValue>({
      currentValue,
      subscribe: subscription.subscribe,
    });

    const App = () => {
      useSubscription({ context, load, onValue: v => v === 1 });

      return null;
    };

    return { App, load, subscription };
  };

  it('does not call load() and subscribe if onValue() returns false on init', () => {
    const currentValue = () => 0;
    const { App, load, subscription } = createApp({ currentValue });

    render(<App />);

    expect(subscription.subscribe).toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  it('calls load() and not subscribe if onValue() returns true on initial render', () => {
    const currentValue = () => 1;
    const { App, load, subscription } = createApp({ currentValue });

    render(<App />);

    expect(subscription.subscribe).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
  });

  it('does not call load() if onValue() returns false on subscription update', () => {
    const currentValue = jest.fn().mockReturnValue(0);
    const { App, load, subscription } = createApp({ currentValue });

    render(<App />);

    act(() => {
      subscription.trigger();
    });

    expect(currentValue).toHaveBeenCalledTimes(2);
    expect(load).not.toHaveBeenCalled();
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });

  it('calls load() and unsubscribes if onValue() returns true on subscription update', () => {
    const currentValue = jest
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1);

    const { App, load, subscription } = createApp({
      currentValue,
    });

    render(<App />);

    act(() => {
      subscription.trigger();
    });

    expect(currentValue).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalled();
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
