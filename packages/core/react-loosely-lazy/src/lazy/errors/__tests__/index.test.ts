import { createLoaderError, errorSymbol, isLoaderError } from '../index';

describe('createLoaderError', () => {
  it('returns the input string without the loader error symbol', () => {
    const error = 'An error occurred...';
    const loaderError = createLoaderError(error);

    expect(loaderError).toBe(error);
    expect(Object.getOwnPropertySymbols(loaderError)).toEqual([]);
  });

  it.each([
    ['plain error object', { message: 'An error occurred...' }],
    ['error object', new Error('An error occurred...')],
    [
      'custom error object',
      new TypeError("Cannot read property 'foo' of null"),
    ],
  ])('returns the %s error with the loader error symbol', (_, error) => {
    const loaderError = createLoaderError(error);

    expect(loaderError).toBe(error);
    expect(Object.getOwnPropertySymbols(loaderError)).toEqual([errorSymbol]);
  });
});

describe('isLoaderError', () => {
  it('returns true when given an error with the loader error symbol', () => {
    const error = new Error('');
    Object.assign(error, { [errorSymbol]: true });
    expect(isLoaderError(error)).toBe(true);
  });

  it('returns true when given an error constructed with createLoaderError', () => {
    const error = new Error('');
    const loaderError = createLoaderError(error);
    expect(isLoaderError(loaderError)).toBe(true);
  });

  it('returns false when given an error', () => {
    const error = new Error('');
    expect(isLoaderError(error)).toBe(false);
  });
});
