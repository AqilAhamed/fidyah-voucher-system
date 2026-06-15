import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminLogin         = (email, password) => api.post('/api/auth/login', { email, password, role: 'admin' });
export const getStats           = ()                 => api.get('/api/admin/stats');
export const getUsers           = ()                 => api.get('/api/admin/users');
export const getMerchants       = ()                 => api.get('/api/admin/merchants');
export const approveMerchant    = (id, approved)     => api.patch(`/api/admin/merchants/${id}/approve`, { approved });
export const issueVoucher       = (data)             => api.post('/api/admin/issue-voucher', data);
export const issueBulk          = (data)             => api.post('/api/admin/issue-bulk', data);
export const getLedger          = ()                 => api.get('/api/admin/ledger');
export const markPaidOut        = (merchantId)       => api.patch(`/api/admin/ledger/merchant/${merchantId}/payout`);
export const voidVoucher        = (id)               => api.patch(`/api/admin/vouchers/${id}/void`);
export const getPhysicalVoucherPDF = (campaignId)    => api.get(`/api/admin/generate-pdf/${campaignId}`, { responseType: 'blob' });

export default api;
