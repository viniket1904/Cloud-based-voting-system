import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000, // 10 second timeout
});

// Add token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (server not running, no internet, etc.)
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return Promise.reject(new Error('Cannot connect to server. Please make sure the backend server is running on http://localhost:5000'));
    }
    
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection and try again.'));
    }
    
    // Server responded with error status
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || error.response.statusText || 'Server error';
      return Promise.reject(new Error(message));
    }
    
    // Other errors
    return Promise.reject(error);
  }
);

// AUTH APIs
export const authApi = {
  register: (data) => API.post("/auth/register", data).then((r) => r.data),
  login: (data) => API.post("/auth/login", data).then((r) => r.data),
  verifyFace: (descriptor) =>
    API.post("/auth/verify-face", { descriptor }).then((r) => r.data),
  me: () => API.get("/auth/me").then((r) => r.data),
};

// ELECTION APIs
export const electionsApi = {
  list: (status) => {
    const params = status ? { status } : {};
    return API.get('/elections', { params }).then((r) => r.data);
  },
  get: (id) => API.get(`/elections/${id}`).then((r) => r.data),
  create: (data) => API.post('/elections', data).then((r) => r.data),
  update: (id, data) => API.patch(`/elections/${id}`, data).then((r) => r.data),
  addParty: (electionId, partyData) => 
    API.post(`/elections/${electionId}/parties`, partyData).then((r) => r.data),
  notify: (electionId, forceRenotify = false) => {
    // Increase timeout for notify endpoint (sending emails can take time)
    const url = forceRenotify 
      ? `/elections/${electionId}/notify?force=true`
      : `/elections/${electionId}/notify`;
    return API.post(url, {}, { timeout: 60000 }).then((r) => r.data);
  },
  getResults: (id) => 
    API.get(`/elections/${id}/results`).then((r) => r.data),
  myVote: (id) =>
    API.get(`/elections/${id}/my-vote`).then((r) => r.data),
};

// VOTE APIs
export const votesApi = {
  cast: (electionId, partyId, faceToken) =>
    API.post("/votes", {
      election_id: electionId,
      party_id: partyId,
      face_verification_token: faceToken,
    }).then((r) => r.data),
};

export default API;
