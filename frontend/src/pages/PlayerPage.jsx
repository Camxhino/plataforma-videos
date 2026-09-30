import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PlayerPage() {
  const { id } = useParams();
  const userId = localStorage.getItem('userId');

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      try {
        // 1. Cargar detalles del video
        const videoRes = await api.get(`/videos/${id}`);
        setVideo(videoRes.data);

        // 2. Cargar comentarios
        const commentsRes = await api.get(`/videos/${id}/comments`);
        setComments(commentsRes.data);

        // 3. Cargar videos recomendados
        const allVideosRes = await api.get('/videos');
        const filtered = allVideosRes.data.filter((v) => v.id !== parseInt(id));
        setRecommended(filtered);
      } catch (err) {
        setError('Error al cargar la información del video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!userId) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    try {
      const response = await api.post(`/videos/${id}/comments?user_id=${userId}`, {
        content: newComment,
      });

      setComments([...comments, response.data]);
      setNewComment('');
    } catch (err) {
      alert('No se pudo publicar el comentario');
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Cargando video...</p>;
  if (error || !video) return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;

  return (
    <div style={styles.container}>
      {/* Sección Izquierda: Reproductor, Info y Comentarios */}
      <div style={styles.mainContent}>
        <video controls autoPlay src={video.video_url} style={styles.videoPlayer}>
          Tu navegador no soporta la reproducción de video.
        </video>

        <h1 style={styles.title}>{video.title}</h1>
        <p style={styles.views}>👁️ {video.views} reproducciones</p>
        <p style={styles.description}>{video.description || 'Sin descripción disponible.'}</p>

        <hr style={styles.divider} />

        {/* Sección de Comentarios */}
        <h3>Comentarios ({comments.length})</h3>

        {userId ? (
          <form onSubmit={handleAddComment} style={styles.commentForm}>
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={styles.commentInput}
            />
            <button type="submit" style={styles.commentBtn}>Comentar</button>
          </form>
        ) : (
          <p style={{ italic: 'true', color: '#666' }}>
            <Link to="/auth">Inicia sesión</Link> para dejar un comentario.
          </p>
        )}

        <div style={styles.commentList}>
          {comments.map((comment) => (
            <div key={comment.id} style={styles.commentItem}>
              <strong>{comment.user_name || 'Usuario'}</strong>
              <p style={{ margin: '0.3rem 0 0 0' }}>{comment.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sección Derecha: Videos Recomendados */}
      <div style={styles.sidebar}>
        <h3>Recomendados</h3>
        {recommended.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#666' }}>No hay más videos disponibles.</p>
        ) : (
          recommended.map((rec) => (
            <Link key={rec.id} to={`/video/${rec.id}`} style={styles.recCard}>
              <img src={rec.thumbnail_url} alt={rec.title} style={styles.recThumb} />
              <div>
                <h4 style={styles.recTitle}>{rec.title}</h4>
                <span style={styles.recViews}>{rec.views} vistas</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  mainContent: { flex: '3', minWidth: '300px' },
  sidebar: { flex: '1', minWidth: '250px' },
  videoPlayer: { width: '100%', maxHeight: '480px', backgroundColor: '#000', borderRadius: '8px' },
  title: { fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.2rem' },
  views: { color: '#666', fontSize: '0.9rem', marginBottom: '1rem' },
  description: { lineHeight: '1.5' },
  divider: { margin: '1.5rem 0', borderColor: '#eee' },
  commentForm: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  commentInput: { flex: '1', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' },
  commentBtn: { padding: '0.6rem 1.2rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  commentList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  commentItem: { padding: '0.8rem', backgroundColor: '#f9f9f9', borderRadius: '6px', borderLeft: '4px solid #007bff' },
  recCard: { display: 'flex', gap: '0.8rem', textDecoration: 'none', color: 'inherit', marginBottom: '1rem' },
  recThumb: { width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px' },
  recTitle: { fontSize: '0.95rem', margin: '0 0 0.2rem 0' },
  recViews: { fontSize: '0.8rem', color: '#666' },
};