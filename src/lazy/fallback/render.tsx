import React, { useRef, useLayoutEffect } from 'react';

function isLinkPrefetch(el: HTMLElement): el is HTMLLinkElement {
  return el.tagName === 'LINK' && (el as HTMLLinkElement).rel === 'prefetch';
}

const usePlaceholderRender = (resolveId: string, content: HTMLElement[]) => {
  const hydrationRef = useRef<HTMLInputElement | null>(null);
  const { current: ssrDomNodes } = useRef(content || ([] as HTMLElement[]));

  useLayoutEffect(() => {
    const element = hydrationRef.current;
    const { parentNode } = element || {};

    if (parentNode && !parentNode.contains(ssrDomNodes[0])) {
      ssrDomNodes.reverse().forEach((node: HTMLElement) => {
        // this fixes an issue with Chrome that re-triggers and cancels prefetch
        // when node is appended again, making network panel quite noisy
        if (isLinkPrefetch(node)) node.rel = '';

        parentNode.insertBefore(node, (element as any).nextSibling);
      });
    }

    return () => {
      ssrDomNodes.forEach((node: HTMLElement) =>
        node.parentNode?.removeChild(node)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationRef.current, ssrDomNodes]);

  return hydrationRef;
};

export type PlaceholderFallbackRenderProps = {
  id: string;
  content: HTMLElement[];
};

export const PlaceholderFallbackRender = ({
  id,
  content,
}: PlaceholderFallbackRenderProps) => {
  const placeholderRef = usePlaceholderRender(id, content);

  return <input type="hidden" data-lazy-begin={id} ref={placeholderRef} />;
};
