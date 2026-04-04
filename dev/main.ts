import React from 'react';
import { createRoot } from 'react-dom/client';
import { KetikinEditor } from '../src';
import { DocElement } from '../src/types';

const initialElements: DocElement[] = [];

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(KetikinEditor, { initialElements }));
}
