import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/auth');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>📹 StreamApp</Link>
      <div>
        {userId ? (
          <>
            <Link to="/profile" style={styles.link}>Mi Perfil</Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
          </>
        ) : (
          <Link to="/auth" style={styles.link}>Iniciar Sesión / Registro</Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', background: '#1a1a1a', color: '#fff', alignItems: 'center' },
  logo: { fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', textDecoration: 'none' },
  link: { color: '#fff', marginRight: '1rem', textDecoration: 'none' },
  logoutBtn: { background: '#ff4d4d', color: '#fff', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px' }
};