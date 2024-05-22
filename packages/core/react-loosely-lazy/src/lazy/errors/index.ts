export const errorSymbol = Symbol.for('react-loosely-lazy/loader-error');

export const createLoaderError = (error: unknown) => {
  if (typeof error === 'object') {
    // @ts-expect-error Explicitly untyped
    return Object.assign(error, { [errorSymbol]: true });
  }

  return error;
};

export const isLoaderError = (error: unknown) =>
  Object.getOwnPropertySymbols(error).includes(errorSymbol);
