import React from 'react';
import { ProjectsDirectory } from './projects-directory';

export type MainProps = {
  source: string;
};

const Main = ({ source }: MainProps) => {
  if (window.start) {
    console.log('Interactive from', source, Date.now() - window.start);
  }

  return (
    <div>
      <h2>
        hello world from {source} {window.start ? 'interactive' : ''}
      </h2>
      <ProjectsDirectory />
    </div>
  );
};

export default Main;
