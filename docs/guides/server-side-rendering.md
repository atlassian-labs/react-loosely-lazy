# Server-side rendering
Server-side rendering is handled transparently in a single render pass, when you add our [babel plugin](tooling/babel-plugin) to your project configuration.  This plugin will transform the client and server source code as needed, while `react-loosely-lazy` ensures the rendered content is identical between the server and the client.

## Compatibility table

| Method | Support |
| ------ | ------- |
| [ReactDOM.hydrate()](https://reactjs.org/docs/react-dom.html#hydrate) | ✅ |
| [ReactDOM.render()](https://reactjs.org/docs/react-dom.html#render) | ✅ |
| [ReactDOMServer.renderToNodeStream()](https://reactjs.org/docs/react-dom-server.html#rendertonodestream) | ✅   |
| [ReactDOMServer.renderToString()](https://reactjs.org/docs/react-dom-server.html#rendertostring) | ✅ |

## Enabling server-side rendering
Server-side rendering can be enabled in your application by [initialising](api/init) the library on the client, and adding the [`@react-loosely-lazy/babel-plugin`](tooling/babel-plugin) to both the client and server babel configuration.

### Server configuration
#### Babel configuration
```json
{
  "plugins": [
    ["@react-loosely-lazy/babel-plugin", { "client": false }]
  ]
}
```

### Client configuration
#### Initialisation
```jsx
import { hydrate } from 'react-dom';
import LooselyLazy from 'react-loosely-lazy';
import { App } from './app';

LooselyLazy.init();

hydrate(
  <App />,
  document.getElementById('root'),
);
```
#### Babel configuration
```json
{
  "plugins": [
    ["@react-loosely-lazy/babel-plugin", { "client": true }]
  ]
}
```
