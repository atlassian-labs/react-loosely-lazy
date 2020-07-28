export type JavaScriptModule<C> = {
  default: C;
};

export type ClientLoader<C> = () => Promise<JavaScriptModule<C> | C>;

export type ServerLoader<C> = () => JavaScriptModule<C> | C;

export type Loader<C> = ClientLoader<C> | ServerLoader<C>;
