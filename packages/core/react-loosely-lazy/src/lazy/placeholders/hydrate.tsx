import React, { createElement, Fragment } from 'react';
import { attrToProp } from '../../utils';

export type PlaceholderFallbackHydrateProps = {
  id: string;
  content: HTMLElement[];
};

export const PlaceholderFallbackHydrate = ({
  id,
  content,
}: PlaceholderFallbackHydrateProps) => {
  return (
    <>
      <input type="hidden" data-lazy-begin={id} />
      {content.map((el: HTMLElement, i: number) => {
        const { tagName = '', childNodes = [], attributes = [] } = el;
        const props = Array.from(attributes).reduce(attrToProp, {
          key: String(i),
        });
        // text node
        if (!tagName) return createElement(Fragment, props, el.textContent);

        // childless tag
        if (!childNodes.length)
          return createElement(tagName.toLowerCase(), props);

        // tag with content
        return createElement(tagName.toLowerCase(), {
          ...props,
          dangerouslySetInnerHTML: { __html: '' },
          suppressHydrationWarning: true,
        });
      })}
      <input type="hidden" data-lazy-end={id} />
    </>
  );
};
