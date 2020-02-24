import React, { useRef, useLayoutEffect } from 'react';

const usePlaceholderRender = (resolveId: string, content: any) => {
  const hydrationRef = useRef<HTMLInputElement | null>(null);
  const { current: ssrDomNodes } = useRef(content || ([] as HTMLElement[]));

  useLayoutEffect(() => {
    const element = hydrationRef.current;
    const { parentNode } = element || {};

    if (parentNode && !parentNode.contains(ssrDomNodes[0])) {
      ssrDomNodes
        .reverse()
        .forEach((node: any) =>
          parentNode.insertBefore(node, (element as any).nextSibling)
        );
    }
    return () => {
      ssrDomNodes.forEach((node: any) => node.parentNode.removeChild(node));
      ssrDomNodes.length = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationRef.current, ssrDomNodes]);

  return hydrationRef;
};

export const PlaceholderFallbackRender = ({ id, content }: any) => {
  const placeholderRef = usePlaceholderRender(id, content);
  return <input type="hidden" data-lazy-begin={id} ref={placeholderRef} />;
};
