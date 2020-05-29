import React from 'react';

export type ImportDefaultComponent = {
  default: React.ComponentType<any>;
};

export type Loader = ClientLoader | ServerLoader;

export type ClientLoader = () => Promise<ImportDefaultComponent>;

export type ServerLoader = () =>
  | ImportDefaultComponent
  | React.ComponentType<any>;
