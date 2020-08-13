import LooselyLazy, { MODE } from 'react-loosely-lazy';

import { buildAfterPaintComponents, AfterPaintComponents } from './after-paint';
import { buildForPaintComponents, ForPaintComponents } from './for-paint';
import { buildCustomWaitComponents, CustomWaitComponents } from './custom-wait';
import { buildLazyComponents, LazyComponents } from './lazy';

export function buildServerComponents(mode: keyof typeof MODE) {
  // force components reset faking server/client
  window.name = 'nodejs';
  LooselyLazy.init(mode);
  buildForPaintComponents.server();
  buildAfterPaintComponents.server();
  buildLazyComponents.server();
  buildCustomWaitComponents.server();
}

export function buildClientComponents(mode: keyof typeof MODE) {
  // force components reset faking server/client
  window.name = '';
  LooselyLazy.init(mode);
  buildForPaintComponents.client();
  buildAfterPaintComponents.client();
  buildLazyComponents.server();
  buildCustomWaitComponents.client();
}

export {
  AfterPaintComponents,
  ForPaintComponents,
  LazyComponents,
  CustomWaitComponents,
};
