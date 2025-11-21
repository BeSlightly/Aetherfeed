import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Resources from './pages/Resources';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router basename="/Aetherfeed">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="resources" element={<Resources />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
