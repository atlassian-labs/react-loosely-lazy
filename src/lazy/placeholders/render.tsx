import React, { useRef, useLayoutEffect } from 'react';

const usePlaceholderRender = (resolveId: string, content: HTMLElement[]) => {
  const hydrationRef = useRef<HTMLInputElement | null>(null);
  const { current: ssrDomNodes } = useRef(content || ([] as HTMLElement[]));

  useLayoutEffect(() => {
    const element = hydrationRef.current;
    const { parentNode } = element || {};

    if (parentNode && !parentNode.contains(ssrDomNodes[0])) {
      ssrDomNodes
        .reverse()
        .forEach((node: HTMLElement) =>
          parentNode.insertBefore(node, (element as any).nextSibling)
        );
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

const PlaceholderFallbackRenderOriginal = ({
  id,
  content,
}: PlaceholderFallbackRenderProps) => {
  const placeholderRef = usePlaceholderRender(id, content);

  return <input type="hidden" data-lazy-begin={id} ref={placeholderRef} />;
};

const PlaceholderFallbackRenderNew = ({
  id,
  content,
}: PlaceholderFallbackRenderProps) => {
  const placeholderRef = (element: Element | null) => {
    const { parentNode } = element || content[0] || {};

    if (!parentNode) {
      return;
    }

    if (!element) {
      // on async-bundle/input removal
      content.forEach((node) => {
        try {
          parentNode.removeChild(node);
        } catch (e) {

        }
      });
      content.length = 0;
      return;
    }

    if (parentNode.contains(content[0])) {
      return;
    }

    console.log('inserting lazy placeholder', Date.now() - window.start);
    content
      .reverse()
      .forEach((node: HTMLElement) =>
        parentNode.insertBefore(node, (element as any).nextSibling)
      );
  };

  return <input type="hidden" data-lazy-begin={id} ref={placeholderRef} />;
};

export const PlaceholderFallbackRender = PlaceholderFallbackRenderNew;
