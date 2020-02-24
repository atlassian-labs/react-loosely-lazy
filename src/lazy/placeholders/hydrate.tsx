import React, { Fragment } from 'react';

export const PlaceholderFallbackHydrate = ({ id, content }: any) => {
  return (
    <>
      <input type="hidden" data-lazy-begin={id} />
      {content.map((el: HTMLElement, i: number) =>
        el.tagName
          ? React.createElement(el.tagName.toLocaleLowerCase(), {
              key: String(i),
              dangerouslySetInnerHTML: { __html: '' },
              suppressHydrationWarning: true,
            })
          : React.createElement(Fragment, { key: String(i) }, el.textContent)
      )}
      <input type="hidden" data-lazy-end={id} />
    </>
  );
};
