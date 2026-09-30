import axios from 'axios';

// En producción leerá la IP de EC2 desde .env
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export default api;