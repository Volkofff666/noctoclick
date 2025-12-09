import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import BlockedIPs from './pages/BlockedIPs';
import Settings from './pages/Settings';
import YandexConnect from './pages/YandexConnect';
import Login from './pages/Login';
import Register from './pages/Register';
import Sites from './pages/Sites';
import Profile from './pages/Profile';
import './styles/global.css';

// Проверка авторизации
function RequireAuth({ children }) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Редирект если уже залогинен
function RedirectIfAuth({ children }) {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    return <Navigate to="/sites" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Публичные роуты */}
        <Route path="/login" element={
          <RedirectIfAuth>
            <Login />
          </RedirectIfAuth>
        } />
        <Route path="/register" element={
          <RedirectIfAuth>
            <Register />
          </RedirectIfAuth>
        } />

        {/* Защищённые роуты */}
        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/sites" replace />} />
          <Route path="sites" element={<Sites />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="blocked" element={<BlockedIPs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="yandex" element={<YandexConnect />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;