import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://hungry-plants-join.loca.lt'; 

const api = axios.create({ 
  baseURL: BASE_URL,
  headers: {
    'Bypass-Tunnel-Reminder': 'true' 
  }
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('merchantToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginMerchant    = (email, password) => api.post('/api/auth/login', { email, password, role: 'merchant' });
export const registerMerchant = (data)            => api.post('/api/auth/register/merchant', data);
export const redeemVoucher    = (qr_payload)      => api.post('/api/merchant/redeem', { qr_payload });
export const getMerchantLedger = ()               => api.get('/api/merchant/ledger');

export default api;