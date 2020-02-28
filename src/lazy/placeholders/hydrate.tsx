import React, { Fragment } from 'react';

export const PlaceholderFallbackHydrate = ({ id, content }: any) => {
  return (
    <>
      <input type="hidden" data-lazy-begin={id} />
      {content.map((el: HTMLElement, i: number) => {
        const { tagName = '', childNodes = [] } = el;
        const props = { key: String(i) };
        // text node
        if (!tagName)
          return React.createElement(Fragment, props, el.textContent);

        // childless tag
        if (!childNodes.length)
          return React.createElement(tagName.toLowerCase(), props);

        // tag with content
        return React.createElement(tagName.toLowerCase(), {
          ...props,
          dangerouslySetInnerHTML: { __html: '' },
          suppressHydrationWarning: true,
        });
      })}
      <input type="hidden" data-lazy-end={id} />
    </>
  );
};
