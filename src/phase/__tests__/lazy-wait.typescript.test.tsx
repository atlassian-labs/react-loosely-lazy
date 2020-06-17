import React from 'react';
import { LazyWait } from 'react-loosely-lazy';

// @ts-expect-error children and until props are missing
<LazyWait />;

// @ts-expect-error children prop is missing
<LazyWait until />;

// @ts-expect-error children prop is missing
<LazyWait until={true} />;

// @ts-expect-error children prop is missing
<LazyWait until={false} />;

// @ts-expect-error string is incompatible with boolean
<LazyWait until="true">children</LazyWait>;

<LazyWait until>children</LazyWait>;

<LazyWait until={true}>children</LazyWait>;

<LazyWait until={false}>children</LazyWait>;
