import React, { useRef, useLayoutEffect } from 'react';

const usePlaceholderRender = (resolveId: string, content: HTMLElement[]) => {
  const hydrationRef = useRef<HTMLInputElement | null>(null);
  const { current: ssrDomNodes } = useRef(content || ([] as HTMLElement[]));

  useLayoutEffect(() => {
    const element = hydrationRef.current;
    const { parentNode } = element || {};

    if (parentNode && !parentNode.contains(ssrDomNodes[0])) {
      ssrDomNodes.reverse().forEach((node: HTMLElement) => {
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
