// @flow strict

import React from 'react';
import { LazyWait } from 'react-loosely-lazy';

// $FlowExpectedError children and until props are missing
<LazyWait />;

// $FlowExpectedError children prop is missing
<LazyWait until />;

// $FlowExpectedError children prop is missing
<LazyWait until={true} />;

// $FlowExpectedError children prop is missing
<LazyWait until={false} />;

// $FlowExpectedError string is incompatible with boolean
<LazyWait until="true">children</LazyWait>;

<LazyWait until>children</LazyWait>;

<LazyWait until={true}>children</LazyWait>;

<LazyWait until={false}>children</LazyWait>;
