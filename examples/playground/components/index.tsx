import LooselyLazy, { MODE } from 'react-loosely-lazy';

import { buildAfterPaintComponents } from './after-paint';
import { buildForPaintComponents } from './for-paint';
import { buildCustomWaitComponents } from './custom-wait';
import { buildLazyComponents } from './lazy';

export function buildServerComponents(mode: keyof typeof MODE) {
  // force components reset faking server/client
  window.name = 'nodejs';
  LooselyLazy.init(mode);

  return {
    ForPaint: buildForPaintComponents.server(),
    AfterPaint: buildAfterPaintComponents.server(),
    Lazy: buildLazyComponents.server(),
    CustomWait: buildCustomWaitComponents.server(),
  };
}

export function buildClientComponents(mode: keyof typeof MODE) {
  // force components reset faking server/client
  window.name = '';
  LooselyLazy.init(mode);

  return {
    ForPaint: buildForPaintComponents.client(),
    AfterPaint: buildAfterPaintComponents.client(),
    Lazy: buildLazyComponents.client(),
    CustomWait: buildCustomWaitComponents.client(),
  };
}
