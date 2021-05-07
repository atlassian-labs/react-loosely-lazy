import { retry, Retryable, RetryPolicyConfiguration } from '..';

describe('retry', () => {
  const error = new Error('An error occurred...');

  const range = (start: number, stop: number, step = 1) =>
    Array.from(
      { length: (stop - start) / step + 1 },
      (_, i) => start + i * step
    );

  const createRetryable = (retries: number) => {
    let attempt = 0;

    return jest.fn(() => {
      if (attempt < retries) {
        attempt += 1;

        return Promise.reject(error);
      }

      return Promise.resolve('Success');
    });
  };

  it('does not retry by default', async () => {
    const retryable = jest.fn(() => Promise.reject(error));
    const promise = retry(retryable);

    await expect(promise).rejects.toEqual(error);
    expect(retryable).toHaveBeenCalledTimes(1);
  });

  describe('maxAttempts', () => {
    it('retries indefinitely when maxAttempts is undefined', async () => {
      let attempt = 1;
      const retryable = jest.fn(() => {
        if (attempt < 100) {
          attempt += 1;

          return Promise.reject(error);
        }

        return Promise.resolve('Success');
      });

      const promise = retry(retryable, { maxAttempts: undefined });

      expect(await promise).toEqual('Success');
      expect(retryable).toHaveBeenCalledTimes(100);
    });

    it('does not retry when maxAttempts is -n', async () => {
      const n = -100;
      for (const maxAttempts of range(-1, n, -1)) {
        const retryable = jest.fn(() => Promise.reject(error));
        const promise = retry(retryable, { maxAttempts });

        await expect(promise).rejects.toEqual(error);
        expect(retryable).toHaveBeenCalledTimes(1);
      }
    });

    it('does not retry when maxAttempts is -1', async () => {
      const retryable = jest.fn(() => Promise.reject(error));
      const promise = retry(retryable, { maxAttempts: -1 });

      await expect(promise).rejects.toEqual(error);
      expect(retryable).toHaveBeenCalledTimes(1);
    });

    it('does not retry when maxAttempts is 0', async () => {
      const retryable = jest.fn(() => Promise.reject(error));
      const promise = retry(retryable, { maxAttempts: 0 });

      await expect(promise).rejects.toEqual(error);
      expect(retryable).toHaveBeenCalledTimes(1);
    });

    it('retries once when maxAttempts is 1', async () => {
      const retryable = jest.fn(() => Promise.reject(error));
      const promise = retry(retryable, { maxAttempts: 1 });

      await expect(promise).rejects.toEqual(error);
      expect(retryable).toHaveBeenCalledTimes(2);
    });

    it('retries n times when maxAttempts is n', async () => {
      const n = 100;
      for (const maxAttempts of range(0, n)) {
        const retryable = jest.fn(() => Promise.reject(error));
        const promise = retry(retryable, { maxAttempts });

        await expect(promise).rejects.toEqual(error);
        expect(retryable).toHaveBeenCalledTimes(maxAttempts + 1);
      }
    });
  });

  describe('delay', () => {
    const delay = 100;

    type TestRetriesOptions = {
      configuration: RetryPolicyConfiguration;
      n: number;
      retryable: Retryable<unknown>;
    };

    const testRetries = async ({
      configuration,
      n,
      retryable,
    }: TestRetriesOptions) => {
      retry(retryable, configuration).catch(() => {
        // Do nothing...
      });

      expect(retryable).toHaveBeenCalledTimes(1);

      await jest.runAllTicks();
      expect(retryable).toHaveBeenCalledTimes(2);

      let expectedCalls = 2;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _ of range(0, n - expectedCalls)) {
        await jest.runAllTicks();

        // Check that we have not called the retryable before the delay elapses
        await jest.advanceTimersByTime(delay - 1);
        expect(retryable).toHaveBeenCalledTimes(expectedCalls);

        await jest.advanceTimersByTime(1);
        expectedCalls += 1;
        expect(retryable).toHaveBeenCalledTimes(expectedCalls);
      }
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('with no maxAttempts', () => {
      it('does not delay the initial attempt', async () => {
        const retryable = jest.fn(() => Promise.resolve('Success'));

        await retry(retryable, { delay });

        expect(retryable).toHaveBeenCalledTimes(1);
      });

      it('does not delay the initial retry', async () => {
        const retryable = createRetryable(1);

        await retry(retryable, { delay }).catch(() => {
          // Do nothing...
        });

        expect(retryable).toHaveBeenCalledTimes(2);
      });

      it('delays n retries after the initial retry by the specified amount', async () => {
        const n = 100;
        const retryable = createRetryable(n);

        await testRetries({
          configuration: {
            delay,
          },
          n,
          retryable,
        });
      });
    });

    describe('with a specified maxAttempts', () => {
      it('does not delay the initial attempt', async () => {
        const retryable = jest.fn(() => Promise.resolve('Success'));

        await retry(retryable, { delay, maxAttempts: 0 });

        expect(retryable).toHaveBeenCalledTimes(1);
      });

      it('does not delay the initial retry', async () => {
        const retryable = jest.fn(() => Promise.reject(error));

        await retry(retryable, { delay, maxAttempts: 1 }).catch(() => {
          // Do nothing...
        });

        expect(retryable).toHaveBeenCalledTimes(2);
      });

      it('delays n retries after the initial retry by the specified amount', async () => {
        const retryable = jest.fn(() => Promise.reject(error));
        const n = 100;

        await testRetries({
          configuration: {
            delay,
            maxAttempts: n,
          },
          n,
          retryable,
        });
      });
    });
  });

  describe('factor', () => {
    type TestFactorOptions = {
      delay: number;
      expectedDelays: number[];
      factor?: number;
    };

    const testFactor = async ({
      delay,
      expectedDelays,
      factor,
    }: TestFactorOptions) => {
      const retryable = createRetryable(expectedDelays.length + 1);

      retry(retryable, { delay, factor });

      let expectedCalls = 1;
      expect(retryable).toHaveBeenCalledTimes(expectedCalls);

      await jest.runAllTicks();
      expectedCalls += 1;
      expect(retryable).toHaveBeenCalledTimes(expectedCalls);

      for (const expectedDelay of expectedDelays) {
        await jest.runAllTicks();

        await jest.advanceTimersByTime(expectedDelay - 1);
        expect(retryable).toHaveBeenCalledTimes(expectedCalls);

        await jest.advanceTimersByTime(1);
        expectedCalls += 1;
        expect(retryable).toHaveBeenCalledTimes(expectedCalls);
      }
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not modify the delay when the factor is not provided', async () => {
      await testFactor({
        delay: 300,
        expectedDelays: [300, 300, 300, 300, 300],
      });
    });

    it('does not modify the delay when the factor is 0', async () => {
      await testFactor({
        delay: 300,
        expectedDelays: [300, 300, 300, 300, 300],
        factor: 0,
      });
    });

    describe('increases the delay for each retry', () => {
      it('by the delay when factor is 1', async () => {
        // Linear factor of 1 increases the delay by 300 on each iteration
        await testFactor({
          delay: 300,
          expectedDelays: [300, 600, 900, 1200, 1500],
          factor: 1,
        });
      });

      it('by the delay multiplied by the factor when the factor is >1', async () => {
        // Linear factor of 2 increases the delay by 600 on each iteration
        await testFactor({
          delay: 300,
          expectedDelays: [300, 900, 1500, 2100, 2700],
          factor: 2,
        });
      });
    });
  });
});
