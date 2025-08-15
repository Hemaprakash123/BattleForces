import axios from 'axios';

const BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
});

export function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default api;
