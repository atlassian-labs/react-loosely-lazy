import React, { Component, ReactNode } from 'react';

const asyncComponentCache = new Map();

type AsyncComponentConsumerData = {
  component: any | null;
  loading: boolean;
  error: Error | null;
};

type FileExports = {
  default: any;
};

type Props = {
  bundleName?: string;
  resolve: () => Promise<FileExports>;
  children: (data: AsyncComponentConsumerData) => ReactNode;
};

type State = AsyncComponentConsumerData & {
  ssrDomNodes: Node[];
};

export type AsyncComponentConsumerProps = Props;

export class AsyncComponentConsumer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const component = asyncComponentCache.get(props.resolve) || null;
    this.state = {
      component,
      loading: !component,
      error: null,
      ssrDomNodes: [],
    };

    // when component is not already in cache
    if (!component) {
      if (window.asyncBundleHtml && props.bundleName !== undefined) {
        const frag = document.createElement('div');
        frag.innerHTML = window.asyncBundleHtml[props.bundleName] || '';
        this.state.ssrDomNodes = [...frag.childNodes];
      }

      if (window.start) {
        console.log('async component consumer resolve()', Date.now() - window.start);
      }
      this.componentPromise = props.resolve();
      // SSR gets actual JS module content, not promise
      if (!this.componentPromise.then) {
        // $FlowFixMe - (SSR workaround) SSR gets actual JS module content, not promise
        this.state.component = this.getAsyncFileComponent(this.componentPromise);
        this.state.loading = false;
      }
    }
  }

  componentDidMount() {
    if (!this.state.component) {
      this.componentPromise.then(this.setAsyncFileData, this.setAsyncFileError);
    }
  }

  componentWillUnmount() {
    this.inUnmounted = true;
  }

  getAsyncFileComponent = (file: FileExports) => {
    const component =
      (typeof file === 'function' || typeof file === 'object') && file.default !== undefined
        ? file.default
        : file;

    asyncComponentCache.set(this.props.resolve, component);
    return component;
  };

  setAsyncFileData = (file: FileExports) => {
    const { bundleName } = this.props;
    const component = this.getAsyncFileComponent(file);

    if (!this.inUnmounted) {
      this.setState({
        component,
        loading: false,
        error: null,
      });
    }
    if (window.asyncBundleHtml) {
      delete window.asyncBundleHtml[bundleName];
    }
  };

  setAsyncFileError = (error: Error) => {
    const { bundleName } = this.props;

    if (!this.inUnmounted) {
      this.setState({
        loading: false,
        error,
      });
      console.warn(
        'async-component',
        `Failed to load async component: ${
          bundleName !== undefined ? bundleName : 'unknown'
        }`,
        error,
      );
    }
    if (window.asyncBundleHtml) {
      delete window.asyncBundleHtml[bundleName];
    }
  };

  insertSsrDomNodes = (element: HTMLElement | null) => {
    const { bundleName } = this.props;
    const { ssrDomNodes } = this.state;
    const { parentNode } = element || ssrDomNodes[0] || {};
    if (!parentNode) return;

    if (!element) {
      // on async-bundle/input removal
      ssrDomNodes.forEach((node) => {
        try {
          parentNode.removeChild(node);
        } catch (e) {
          /* node already gone */
          const msg = `${e.message} [in ${bundleName || ''}]`;
          console.error('async-component', msg, e);
        }
      });
      ssrDomNodes.length = 0;
      return;
    }
    // on re-render
    if (parentNode.contains(ssrDomNodes[0])) return;
    // on first render
    console.log('inserting async placeholder', Date.now() - window.start);
    ssrDomNodes
      .reverse()
      .forEach((node) => parentNode.insertBefore(node, element && element.nextSibling));
  };

  componentPromise: Promise<FileExports>;

  inUnmounted = false;

  render() {
    const { children, bundleName } = this.props;
    const { component, loading, error, ssrDomNodes } = this.state;

    if (!component && ssrDomNodes.length) {
      // loading using ssr output (via ref so we can add as siblings)
      return (
        <async-bundle
          style={{ display: 'none' }}
          data-id={bundleName}
          ref={this.insertSsrDomNodes}
        />
      );
    }

    return window.name === 'nodejs' && bundleName !== undefined ? (
      <>
        <async-bundle style={{ display: 'none' }} data-id={bundleName} />
        {children({ component, loading, error })}
        <script
          data-id={bundleName}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
window.asyncBundleHtml = window.asyncBundleHtml || {};
(function (bundles, name) {
    bundles[name] = '';
    var el = document.querySelector('async-bundle[data-id="${bundleName}"]');
    while (el = el.nextSibling) {
        if (el.dataset && el.dataset.id === name) return;
        bundles[name] += el.outerHTML || el.textContent;
    }
})(window.asyncBundleHtml, '${bundleName}')`,
          }}
        />
      </>
    ) : (
      children({ component, loading, error })
    );
  }
}
