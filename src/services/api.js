import axios from 'axios';

const api = axios.create({
  // Par défaut, on utilise le back sur Render
  baseURL: import.meta.env.VITE_API_URL || 'https://sirh-example-back.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification (401)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
