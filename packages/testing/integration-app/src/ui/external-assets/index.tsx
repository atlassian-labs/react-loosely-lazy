import React from 'react';

import icon from './icon.svg';

import './styles.css';

export const ExternalAssets = () => (
  <div className="external-assets">
    External assets
    <img alt="Icon" src={icon} />
  </div>
);

export default ExternalAssets;
