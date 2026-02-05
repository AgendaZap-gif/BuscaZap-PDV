import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eventos_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("eventos_admin_token");
      localStorage.removeItem("eventos_admin_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, senha) =>
  api.post("/admin/login", { email, senha }).then((r) => r.data);

// Eventos (admin)
export const listEventos = () => api.get("/admin/eventos").then((r) => r.data);
export const getEvento = (id) => api.get(`/admin/eventos/${id}`).then((r) => r.data);
export const createEvento = (data) => api.post("/admin/eventos", data).then((r) => r.data);
export const updateEvento = (id, data) => api.put(`/admin/eventos/${id}`, data).then((r) => r.data);

/** Upload de imagem (banner ou mapa). file = File; tipo = "banner" | "mapa". Retorna { url } */
export const uploadEventoImage = (file, tipo = "banner") => {
  const formData = new FormData();
  formData.append("file", file);
  // Não definir Content-Type: o axios detecta FormData e deixa o navegador definir multipart/form-data com boundary.
  return api
    .post(`/admin/eventos/upload?tipo=${encodeURIComponent(tipo)}`, formData)
    .then((r) => r.data);
};
export const toggleAtivoEvento = (id, ativo) =>
  api.patch(`/admin/eventos/${id}/ativo`, { ativo }).then((r) => r.data);

// Expositores
export const listExpositores = (eventoId) =>
  api.get(`/admin/eventos/${eventoId}/expositores`).then((r) => r.data);
export const createExpositor = (eventoId, data) =>
  api.post(`/admin/eventos/${eventoId}/expositores`, data).then((r) => r.data);
export const updateExpositor = (id, data) =>
  api.put(`/admin/expositores/${id}`, data).then((r) => r.data);
export const deleteExpositor = (id) => api.delete(`/admin/expositores/${id}`);

export default api;
