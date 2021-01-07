import React, { useRef, useLayoutEffect, useCallback } from 'react';

const usePlaceholderRender = (resolveId: string, content: HTMLElement[]) => {
  const hydrationRef = useRef<HTMLInputElement | null>(null);
  const { current: ssrDomNodes } = useRef(content || ([] as HTMLElement[]));

  const insertBeforeParentDom = ({ parentNode, element }: any) => {
    if (parentNode && !parentNode.contains(ssrDomNodes[0])) {
      ssrDomNodes
        .reverse()
        .forEach((node: HTMLElement) =>
          parentNode.insertBefore(node, (element as any).nextSibling)
        );
    }
  };

  const insertBeforeParentDomCallback = useCallback(
    ({ parentNode, element }: any) => {
      if (parentNode && !parentNode.contains(ssrDomNodes[0])) {
        ssrDomNodes
          .reverse()
          .forEach((node: HTMLElement) =>
            parentNode.insertBefore(node, (element as any).nextSibling)
          );
      }
    },
    [ssrDomNodes]
  );

  useLayoutEffect(() => {
    const element = hydrationRef.current;
    const { parentNode } = element || {};

    if (
      (window as any).performance &&
      (window as any).performance.mark &&
      (window as any).isLoadingPhasesForRllMarksEnabled &&
      (window as any).isLoadingPhasesForRllMarksEnabled()
    ) {
      window.performance.mark('jira-spa/rll-component.start');
    }

    if (
      (window as any).isLoadingPhasesForRllRefEnabled &&
      (window as any).isLoadingPhasesForRllRefEnabled()
    ) {
      insertBeforeParentDomCallback({ parentNode, element });
    } else {
      insertBeforeParentDom({ parentNode, element });
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
