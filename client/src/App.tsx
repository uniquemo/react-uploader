import React from 'react';
import Uploader from './components/Uploader';
import './App.css';

function App() {
  return (
    <Uploader
      name='test'
      action='http://localhost:4000/upload'
    />
  );
}

export default App;
