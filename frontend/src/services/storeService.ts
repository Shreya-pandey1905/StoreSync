import axios from "axios";

const API_URL = "http://localhost:5000/api/stores";

const storeService = {
  getStores: () => axios.get(API_URL),
  getStoreById: (id: string) => axios.get(`${API_URL}/${id}`),
  createStore: (data: any) => axios.post(API_URL, data),
  updateStore: (id: string, data: any) => axios.put(`${API_URL}/${id}`, data),
  deleteStore: (id: string) => axios.delete(`${API_URL}/${id}`),
};

export default storeService;
