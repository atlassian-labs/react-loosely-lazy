export { default as hash } from './hash';

export const getExport = (m: any) => ('default' in m ? m.default : m);

export const displayNameFromId = (id: string) => {
  const fName = id.split('/').slice(-3).join('/');

  return fName || 'Component';
};

/**
 * Checks to see if we are running inside a node environment or not.
 * Covers jsdom environments.
 *
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
export const isNodeEnvironment = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  if (window.name === 'nodejs') {
    return true;
  }

  return false;
};
