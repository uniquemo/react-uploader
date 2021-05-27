import React from 'react';
import Uploader from './components/Uploader';
import './App.css';

function App() {
  return (
    <Uploader
      name='file'
      action='http://localhost:5000/upload'
    />
  );
}

export default App;
