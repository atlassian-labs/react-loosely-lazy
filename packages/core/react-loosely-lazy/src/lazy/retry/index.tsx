export type RetryPolicy = {
  delay: number;
  factor: number;
  maxAttempts: number;
};

export type RetryPolicyConfiguration = Partial<RetryPolicy>;

type AttemptContext = {
  attempt: number;
  attemptsRemaining: number;
};

export type Retryable<T> = () => Promise<T>;

const calculateDelay = (context: AttemptContext, policy: RetryPolicy) => {
  const { attempt } = context;
  const { delay, factor } = policy;

  const retryAttempt = attempt - 1;
  // Do not use a delay on the first retry, or when the configured delay is 0
  if (retryAttempt === 1 || delay === 0) {
    return 0;
  }

  // Linear factor, like: https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry#wait-and-retry-with-linear-back-off
  const add = factor * delay;

  return delay + add * (retryAttempt - 2);
};

const sleep = (delay: number) =>
  new Promise(resolve => setTimeout(resolve, delay));

const getPolicy = (configuration: Partial<RetryPolicy>): RetryPolicy => ({
  delay: Math.max(0, configuration.delay ?? 0),
  factor: Math.max(0, configuration.factor ?? 0),
  maxAttempts: Math.max(0, configuration.maxAttempts ?? 0),
});

export function retry<T>(
  retryable: Retryable<T>,
  policyConfiguration: RetryPolicyConfiguration = {}
) {
  const policy = getPolicy(policyConfiguration);

  const { maxAttempts } = policy;
  const context: AttemptContext = {
    attempt: 1,
    attemptsRemaining: maxAttempts,
  };

  const onError = async (err: Error): Promise<T> => {
    if (context.attemptsRemaining === 0) {
      throw err;
    }

    context.attempt += 1;
    context.attemptsRemaining -= 1;

    const delay = calculateDelay(context, policy);
    if (delay) {
      await sleep(delay);
    }

    return retryable().catch(onError);
  };

  return retryable().catch(onError);
}
