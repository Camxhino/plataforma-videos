import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Petición a POST /login
        const response = await api.post('/login', {
          email: formData.email,
          password: formData.password,
        });
        
        // Guardar sesión en localStorage
        localStorage.setItem('userId', response.data.user_id);
        localStorage.setItem('userName', response.data.name);
        navigate('/');
      } else {
        // Petición a POST /users
        await api.post('/users', formData);
        alert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error en la solicitud');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.group}>
              <label>Nombre:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.group}>
            <label>Correo electrónico:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.group}>
            <label>Contraseña:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.btn}>
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          style={styles.toggleBtn}
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '3rem' },
  card: { width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  group: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  input: { padding: '0.5rem', marginTop: '0.2rem', borderRadius: '4px', border: '1px solid #ccc' },
  btn: { padding: '0.7rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  toggleBtn: { marginTop: '1rem', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' },
  error: { color: 'red', marginBottom: '1rem' }
};