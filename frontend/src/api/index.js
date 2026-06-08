import axios from 'axios';

export const BASE  = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const WS    = process.env.REACT_APP_WS_URL  || 'ws://localhost:8000';

const api = axios.create({ baseURL: `${BASE}/api` });

/* Attach JWT to every request */
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('access');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* Auto-refresh on 401 */
api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const { data } = await axios.post(`${BASE}/api/auth/token/refresh/`,
          { refresh: localStorage.getItem('refresh') });
        localStorage.setItem('access', data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/* ── Auth ── */
export const register      = d => api.post('/auth/register/', d);
export const login         = d => api.post('/auth/login/', d);
export const getProfile    = () => api.get('/auth/profile/');
export const updateProfile = d  => api.patch('/auth/profile/', d, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getUsers      = (q = '') => api.get(`/auth/users/?search=${q}`);

/* ── Chat ── */
export const getConversations  = ()  => api.get('/chat/conversations/');
export const startConversation = id  => api.post('/chat/conversations/start/', { user_id: id });
export const getMessages       = id  => api.get(`/chat/conversations/${id}/messages/`);

export default api;
