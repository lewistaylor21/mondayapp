import React from 'react';
import ReactDOM from 'react-dom/client';
import BoardView from './BoardView';
import 'monday-ui-react-core/dist/main.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BoardView />
  </React.StrictMode>
);
