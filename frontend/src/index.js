import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// This is the main entry point for the React application

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/data')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  return (
    <div>
      <h1>Zenbox</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
        {['Strength', 'Flexibility', 'Metabolism', 'Cardio'].map((category, index) => (
          <div
            key={category}
            style={{
              padding: '20px',
              borderRadius: '12px',
              color: 'white',
              backgroundColor: [
                '#e76f00',  // Orange
                '#009999',  // Teal
                '#9933cc',  // Purple
                '#cc0033'   // Red
              ][index]
            }}
          >
            <h2 style={{ margin: 0, fontSize: '32px' }}>{category}</h2>
            <p style={{ margin: '5px 0 0', fontSize: '24px' }}>12 years</p>
          </div>
        ))}
      </div>

      <h2>Information</h2>
      <div style={{ padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px', margin: '20px 0' }}>
        Virtual Assistance Help<br />
        Get more information about...
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
