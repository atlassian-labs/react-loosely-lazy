import React from 'react';
import { render } from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import { MODE } from 'react-loosely-lazy';

import { buildClientApp, buildServerApp } from './ui';

const main = (container: Element) => {
  const mode = MODE.RENDER;

  const ServerApp = buildServerApp(mode);
  const ssr = ReactDOMServer.renderToString(<ServerApp />);

  container.innerHTML = `<div>${ssr}</div>`;

  setTimeout(() => {
    const ClientApp = buildClientApp(mode);
    window.start = Date.now();
    render(<ClientApp />, container);
  }, 3000);
};

const container = document.querySelector('#root');

main(container!);
