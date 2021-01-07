import React from 'react';
import { render } from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import { MODE } from 'react-loosely-lazy';

import { buildClientApp, buildServerApp } from './ui';

const setInnerHTML = (el: Element, html: string) => {
  el.innerHTML = html;

  for (const oldScript of Array.from(el.querySelectorAll('script'))) {
    const newScript = document.createElement('script');
    for (const attr of Array.from(oldScript.attributes)) {
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode!.replaceChild(newScript, oldScript);
  }
};

const main = (container: Element) => {
  const mode = MODE.RENDER;

  const ServerApp = buildServerApp(mode);
  const ssr = ReactDOMServer.renderToString(<ServerApp />);

  setInnerHTML(container, `<div>${ssr}</div>`);

  setTimeout(() => {
    const ClientApp = buildClientApp(mode);
    window.start = Date.now();
    render(<ClientApp />, container);
  }, 3000);
};

const container = document.querySelector('#root');

main(container!);
