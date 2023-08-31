export { default as hash } from './hash';

export const getExport = (m: any) => ('default' in m ? m.default : m);

export const displayNameFromId = (id: string) => {
  const fName = id.split('/').slice(-3).join('/');

  return fName || 'Component';
};

/**
 * Checks to see if we are running inside a node environment or not.
 * Covers jsdom environments and other environments which simply remove
 * window.
 *
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
export const isNodeEnvironment = () => {
  // Some SSR environments remove the window object
  if (typeof window === 'undefined') {
    return true;
  }

  // Official way to check for JSDOM
  if (
    navigator.userAgent.includes('Node.js') ||
    navigator.userAgent.includes('jsdom')
  ) {
    return true;
  }

  // Used by examples to immitate SSR
  if (window.name === 'nodejs') {
    return true;
  }

  return false;
};

export function attrToProp(props: { [k: string]: string }, attr: Attr) {
  switch (attr.name) {
    case 'style':
      // ignore style attr as react does not allow string values
      break;
    case 'class':
      props.className = attr.value;
      break;
    case 'crossorigin':
      props.crossOrigin = attr.value;
      break;
    default:
      props[attr.name] = attr.value;
  }

  return props;
}
