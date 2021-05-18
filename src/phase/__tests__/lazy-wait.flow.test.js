// @flow strict

import React from 'react';
import { LazyWait } from 'react-loosely-lazy';

// $FlowExpectedError[prop-missing] children and until props are missing
<LazyWait />;

// $FlowExpectedError[prop-missing] children prop is missing
<LazyWait until />;

// $FlowExpectedError[prop-missing] children prop is missing
<LazyWait until={true} />;

// $FlowExpectedError[prop-missing] children prop is missing
<LazyWait until={false} />;

// $FlowExpectedError[incompatible-type] string is incompatible with boolean
<LazyWait until="true">children</LazyWait>;

<LazyWait until>children</LazyWait>;

<LazyWait until={true}>children</LazyWait>;

<LazyWait until={false}>children</LazyWait>;
