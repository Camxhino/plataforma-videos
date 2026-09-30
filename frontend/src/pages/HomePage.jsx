import { useState, useEffect } from 'react';
import api from '../services/api';
import VideoCard from '../components/VideoCard';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Petición a GET /videos
        const response = await api.get('/videos');
        setVideos(response.data);
      } catch (err) {
        setError('Error al cargar la lista de videos desde la API');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <p style={{ textAlign: 'center' }}>Cargando catálogo de videos...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Catálogo de Videos</h1>
      
      {videos.length === 0 ? (
        <p>No hay videos publicados aún. ¡Sé el primero en subir uno desde tu perfil!</p>
      ) : (
        <div style={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  }
};