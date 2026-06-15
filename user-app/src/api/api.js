import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CHANGE THIS to your PC's local IP when testing on a real device
// e.g. 'http://192.168.18.59'
const BASE_URL = 'http://192.168.18.59:5000';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginUser = (email, password) =>
  api.post('/api/auth/login', { email, password, role: 'user' });

export const registerUser = (data) =>
  api.post('/api/auth/register/user', data);

export const getMyVouchers = () =>
  api.get('/api/vouchers');

export default api;
