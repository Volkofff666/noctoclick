import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import BlockedIPs from './pages/BlockedIPs';
import Settings from './pages/Settings';
import YandexConnect from './pages/YandexConnect';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blocked" element={<BlockedIPs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/yandex" element={<YandexConnect />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;