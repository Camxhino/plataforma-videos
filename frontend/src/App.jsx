import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PlayerPage from './pages/PlayerPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/video/:id" element={<PlayerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;