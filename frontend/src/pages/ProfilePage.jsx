import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const [userVideos, setUserVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de subida de video
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Estado para la edición rápida
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (!userId) {
      navigate('/auth');
      return;
    }

    fetchUserVideos();
  }, [userId]);

  const fetchUserVideos = async () => {
    try {
      const response = await api.get(`/videos?user_id=${userId}`);
      setUserVideos(response.data);
    } catch (err) {
      console.error('Error al cargar los videos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile || !thumbFile) {
      alert('Debes seleccionar tanto el video (.mp4) como la miniatura');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('user_id', userId);
    formData.append('video_file', videoFile);
    formData.append('thumbnail_file', thumbFile);

    try {
      await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('¡Video publicado exitosamente en Amazon S3!');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbFile(null);
      fetchUserVideos();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al subir el video');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este video? Se borrará también de Amazon S3.')) return;

    try {
      await api.delete(`/videos/${videoId}`);
      setUserVideos(userVideos.filter((v) => v.id !== videoId));
    } catch (err) {
      alert('No se pudo eliminar el video');
    }
  };

  const handleUpdate = async (videoId) => {
    try {
      const formData = new FormData();
      formData.append('title', editTitle);

      await api.put(`/videos/${videoId}`, formData);
      setEditingId(null);
      fetchUserVideos();
    } catch (err) {
      alert('Error al actualizar el video');
    }
  };

  return (
    <div style={styles.container}>
      {/* Información del Usuario */}
      <div style={styles.profileCard}>
        <h2>Perfil de Usuario</h2>
        <p><strong>Nombre:</strong> {userName}</p>
        <p><strong>Videos publicados:</strong> {userVideos.length}</p>
      </div>

      {/* Formulario de Publicación */}
      <div style={styles.section}>
        <h3>Publicar nuevo video</h3>
        <form onSubmit={handleUpload} style={styles.uploadForm}>
          <input
            type="text"
            placeholder="Título del video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.input}
          />
          <textarea
            placeholder="Descripción opcional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...styles.input, height: '80px' }}
          />

          <label>Archivo de Video (.mp4):</label>
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required
          />

          <label>Imagen de Miniatura (JPG, PNG):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files[0])}
            required
          />

          <button type="submit" disabled={uploading} style={styles.submitBtn}>
            {uploading ? 'Subiendo archivos a S3...' : 'Publicar Video'}
          </button>
        </form>
      </div>

      {/* Lista y Gestión de Videos Subidos */}
      <div style={styles.section}>
        <h3>Mis Videos Subidos</h3>
        {loading ? (
          <p>Cargando tus videos...</p>
        ) : userVideos.length === 0 ? (
          <p>No has subido ningún video aún.</p>
        ) : (
          <div style={styles.list}>
            {userVideos.map((vid) => (
              <div key={vid.id} style={styles.item}>
                <img src={vid.thumbnail_url} alt={vid.title} style={styles.thumb} />
                <div style={{ flex: 1 }}>
                  {editingId === vid.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={styles.input}
                      />
                      <button onClick={() => handleUpdate(vid.id)} style={styles.saveBtn}>Guardar</button>
                      <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <h4 style={{ margin: '0 0 0.3rem 0' }}>{vid.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Vistas: {vid.views}</p>
                    </>
                  )}
                </div>

                <div style={styles.actions}>
                  {editingId !== vid.id && (
                    <button
                      onClick={() => { setEditingId(vid.id); setEditTitle(vid.title); }}
                      style={styles.editBtn}
                    >
                      Editar
                    </button>
                  )}
                  <button onClick={() => handleDelete(vid.id)} style={styles.deleteBtn}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  profileCard: { padding: '1.5rem', background: '#f4f4f4', borderRadius: '8px' },
  section: { padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' },
  uploadForm: { display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '500px' },
  input: { padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' },
  submitBtn: { padding: '0.7rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  item: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', border: '1px solid #eee', borderRadius: '6px' },
  thumb: { width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' },
  actions: { display: 'flex', gap: '0.5rem' },
  editBtn: { background: '#ffc107', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' },
  deleteBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' },
  saveBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' },
  cancelBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' },
};