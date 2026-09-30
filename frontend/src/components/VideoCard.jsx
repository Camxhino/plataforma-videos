import { Link } from 'react-router-dom';

export default function VideoCard({ video }) {
  return (
    <Link to={`/video/${video.id}`} style={styles.cardLink}>
      <div style={styles.card}>
        <img src={video.thumbnail_url} alt={video.title} style={styles.thumbnail} />
        <div style={styles.info}>
          <h3 style={styles.title}>{video.title}</h3>
          <p style={styles.meta}>Vistas: {video.views}</p>
        </div>
      </div>
    </Link>
  );
}

const styles = {
  cardLink: { textDecoration: 'none', color: 'inherit' },
  card: { border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  thumbnail: { width: '100%', height: '180px', objectFit: 'cover' },
  info: { padding: '1rem' },
  title: { fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontWeight: 'bold' },
  meta: { fontSize: '0.85rem', color: '#666', margin: 0 }
};