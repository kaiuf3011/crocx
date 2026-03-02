import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import DesignSystemDemo from './components/DesignSystemDemo';
import CommandConsole from './components/console/CommandConsole';
import Login from './components/console/Login';
import Architecture from './components/architecture/Architecture';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<DesignSystemDemo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/console" element={<CommandConsole />} />
          <Route path="/architecture" element={<Architecture />} />
        </Routes>
      </ThemeProvider>

    </BrowserRouter>
  );
}

export default App;
