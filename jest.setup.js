import { format } from 'util';
import '@testing-library/jest-dom/extend-expect';

const error = console.error;

console.error = function(...args) {
  error(...args);
  throw new Error(format(...args));
};
