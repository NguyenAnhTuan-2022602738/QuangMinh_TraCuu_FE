import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './components/App';
import { CustomerProvider } from './context/CustomerContext';
import './styles/main.css';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <CustomerProvider>
        <App />
      </CustomerProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);