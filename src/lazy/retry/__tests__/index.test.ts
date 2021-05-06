import { retry } from '..';

describe('retry', () => {
  const error = new Error('An error occurred...');

  const range = (start: number, stop: number, step = 1) =>
    Array.from(
      { length: (stop - start) / step + 1 },
      (_, i) => start + i * step
    );

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
      for (const x of range(-1, n, -1)) {
        const retryable = jest.fn(() => Promise.reject(error));
        const promise = retry(retryable, { maxAttempts: x });

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
      for (const x of range(0, n)) {
        const retryable = jest.fn(() => Promise.reject(error));
        const promise = retry(retryable, { maxAttempts: x });

        await expect(promise).rejects.toEqual(error);
        expect(retryable).toHaveBeenCalledTimes(x + 1);
      }
    });
  });

  describe('delay', () => {
    const delay = 100;

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not delay the initial attempt', async () => {
      const retryable = jest.fn(() => Promise.resolve('Success'));

      await retry(retryable, { delay });

      expect(retryable).toHaveBeenCalledTimes(1);
    });

    it('does not delay the initial retry', async () => {
      const retryable = jest.fn(() => Promise.reject(error));

      await retry(retryable, { delay, maxAttempts: 1 }).catch(() => {
        // Do nothing...
      });

      expect(retryable).toHaveBeenCalledTimes(2);
    });

    it('delays the second retry by the specified amount', async () => {
      const retryable = jest.fn(() => Promise.reject(error));

      retry(retryable, { delay, maxAttempts: 2 }).catch(() => {
        // Do nothing...
      });

      expect(retryable).toHaveBeenCalledTimes(1);

      await jest.runAllTicks();
      expect(retryable).toHaveBeenCalledTimes(2);

      // Check that we have not called the retryable before the delay elapses
      await jest.runTimersToTime(delay - 1);
      expect(retryable).toHaveBeenCalledTimes(2);

      await jest.runTimersToTime(delay);
      expect(retryable).toHaveBeenCalledTimes(3);
    });

    it('delays n retries after the initial retry by the specified amount', async () => {
      const retryable = jest.fn(() => Promise.reject(error));
      const n = 100;

      retry(retryable, { delay, maxAttempts: n }).catch(() => {
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
    });
  });
});
