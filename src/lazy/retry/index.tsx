export type RetryPolicy = {
  delay: number;
  maxAttempts: number | undefined;
};

type AttemptContext = {
  attemptsRemaining: number;
};

export type Retryable<T> = () => Promise<T>;

const calculateDelay = (context: AttemptContext, policy: RetryPolicy) => {
  const { delay, maxAttempts } = policy;
  // Do not use a delay on the first retry, or when the configured delay is 0
  if (context.attemptsRemaining === maxAttempts || delay === 0) {
    return 0;
  }

  return delay;
};

const sleep = (delay: number) =>
  new Promise(resolve => setTimeout(resolve, delay));

const getPolicy = (configuration: Partial<RetryPolicy>): RetryPolicy => ({
  delay: Math.max(0, configuration.delay ?? 0),
  maxAttempts:
    typeof configuration.maxAttempts === 'number'
      ? Math.max(0, configuration.maxAttempts)
      : configuration.maxAttempts,
});

export function retry<T>(
  retryable: Retryable<T>,
  policyConfiguration: Partial<RetryPolicy> = { maxAttempts: 0 }
) {
  const policy = getPolicy(policyConfiguration);

  const { maxAttempts } = policy;
  const context: AttemptContext = {
    attemptsRemaining: maxAttempts == null ? Infinity : maxAttempts,
  };

  const onError = async (err: Error): Promise<T> => {
    if (context.attemptsRemaining === 0) {
      throw err;
    }

    const delay = calculateDelay(context, policy);
    if (delay) {
      await sleep(delay);
    }

    context.attemptsRemaining -= 1;

    return retryable().catch(onError);
  };

  return retryable().catch(onError);
}
