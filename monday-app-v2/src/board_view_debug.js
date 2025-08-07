import React from 'react';
import ReactDOM from 'react-dom/client';
import BoardViewSimple from './BoardViewSimple';

console.log('=== DEBUG BOARD VIEW ENTRY POINT ===');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  console.log('React root created successfully');
  
  root.render(
    <React.StrictMode>
      <BoardViewSimple />
    </React.StrictMode>
  );
  console.log('React component rendered successfully');
} catch (error) {
  console.error('Error rendering React component:', error);
  
  // Fallback: show error message in DOM
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial;">
      <h1>React Rendering Error</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Stack:</strong></p>
      <pre>${error.stack}</pre>
    </div>
  `;
}