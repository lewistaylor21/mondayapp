import React, { useState, useEffect } from 'react';

const BoardViewSimple = () => {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    console.log('BoardViewSimple component mounted');
    setStatus('React is working!');
    
    // Test Monday SDK
    if (typeof window !== 'undefined') {
      console.log('Window object available');
      console.log('Monday SDK available:', typeof window.mondaySdk);
      
      if (typeof window.mondaySdk !== 'undefined') {
        try {
          const monday = window.mondaySdk();
          console.log('Monday SDK initialized:', monday);
          setStatus('React working + Monday SDK found!');
        } catch (error) {
          console.error('Monday SDK error:', error);
          setStatus('React working, Monday SDK error: ' + error.message);
        }
      } else {
        setStatus('React working, Monday SDK not found');
      }
    }
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f6f7fb',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#323338' }}>🔧 Debug Mode - Simple Board View</h1>
      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e1e5e9'
      }}>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>React Version:</strong> {React.version}</p>
        <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            style={{
              padding: '10px 20px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => {
              console.log('Button clicked - React event handling works!');
              setStatus('Button clicked - React is fully functional!');
            }}
          >
            Test React Event Handling
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>If you can see this, React is rendering correctly.</p>
          <p>Check browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  );
};

export default BoardViewSimple;