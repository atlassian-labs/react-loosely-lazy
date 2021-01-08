import React, { useRef, useLayoutEffect, useCallback } from 'react';

const usePlaceholderRender = (_resolveId: string, content: HTMLElement[]) => {
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
  if (
    (window as any).performance &&
    (window as any).performance.mark &&
    (window as any).isLoadingPhasesForRllMarksEnabled &&
    (window as any).isLoadingPhasesForRllMarksEnabled()
  ) {
    window.performance.mark(
      'jira-spa/rll-PlaceholderFallbackRenderOriginal.start'
    );
  }

  const placeholderRef = usePlaceholderRender(id, content);

  return <input type="hidden" data-lazy-begin={id} ref={placeholderRef} />;
};

const PlaceholderFallbackRenderNew = ({
  id,
  content,
}: PlaceholderFallbackRenderProps) => {
  const placeholderRef = useCallback(
    (element: Element | null) => {
      const { parentNode } = element || content[0] || {};

      if (!parentNode) {
        return;
      }

      if (!element) {
        // on async-bundle/input removal
        content.forEach(node => {
          try {
            parentNode.removeChild(node);
            // eslint-disable-next-line no-empty
          } catch (e) {}
        });
        content.length = 0;

        return;
      }

      if (parentNode.contains(content[0])) {
        return;
      }

      if (
        (window as any).performance &&
        (window as any).performance.mark &&
        (window as any).isLoadingPhasesForRllMarksEnabled &&
        (window as any).isLoadingPhasesForRllMarksEnabled()
      ) {
        window.performance.mark(
          'jira-spa/rll-PlaceholderFallbackRenderNew.start'
        );
      }

      content
        .reverse()
        .forEach((node: HTMLElement) =>
          parentNode.insertBefore(node, (element as any).nextSibling)
        );
    },
    [content]
  );

  return <input type="hidden" data-lazy-begin={id} ref={placeholderRef} />;
};

export const PlaceholderFallbackRender =
  (window as any).isLoadingPhasesForRllRefEnabled &&
  (window as any).isLoadingPhasesForRllRefEnabled()
    ? PlaceholderFallbackRenderNew
    : PlaceholderFallbackRenderOriginal;
