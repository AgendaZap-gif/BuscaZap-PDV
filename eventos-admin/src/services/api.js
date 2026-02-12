import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("eventos_admin_token");
  const expositorToken = localStorage.getItem("eventos_expositor_token");
  const token = adminToken || expositorToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Para FormData, não definir Content-Type: o navegador define multipart/form-data com boundary
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const isExpositor = !!localStorage.getItem("eventos_expositor_token");
      localStorage.removeItem("eventos_admin_token");
      localStorage.removeItem("eventos_admin_user");
      localStorage.removeItem("eventos_expositor_token");
      localStorage.removeItem("eventos_expositor_user");
      window.location.href = isExpositor ? "/expositor/login" : "/login";
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

/** Upload de imagem (banner ou mapa). tipo = "banner" | "mapa"; eventoId = opcional.
 *  Para banner com eventoId: adiciona ao carrossel e retorna { url, bannerImageId }. */
export const uploadEventoImage = (file, tipo = "banner", eventoId = null) => {
  const formData = new FormData();
  formData.append("file", file);
  let q = `tipo=${encodeURIComponent(tipo)}`;
  if (eventoId != null) q += `&eventoId=${encodeURIComponent(eventoId)}`;
  return api
    .post(`/admin/eventos/upload?${q}`, formData)
    .then((r) => r.data);
};

/** Listar imagens do carrossel do banner do evento (API: buscazap-eventos-service) */
export const listBannerImagens = (eventoId) =>
  api.get(`/admin/eventos/${eventoId}/banner-home`).then((r) => r.data);

/** Excluir uma imagem do carrossel do banner */
export const deleteBannerImagem = (eventoId, imageId) =>
  api.delete(`/admin/eventos/${eventoId}/banner-home/${imageId}`);

/** Upload de várias imagens para o carrossel do banner (FormData com múltiplos 'file') */
export const uploadBannerImagensBulk = (eventoId, files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("file", file));
  return api
    .post(`/admin/eventos/${eventoId}/banner-home/bulk`, formData)
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

// Área do expositor (login próprio)
export const expositorLogin = (email, senha) =>
  api.post("/expositor/login", { email, senha }).then((r) => r.data);
export const getExpositorMe = () => api.get("/expositor/me").then((r) => r.data);
export const updateExpositorMe = (data) => api.put("/expositor/me", data).then((r) => r.data);
export const uploadExpositorImage = (file, tipo = "logo") => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/expositor/upload?tipo=${encodeURIComponent(tipo)}`, formData).then((r) => r.data);
};

// Arquivos do expositor (catálogos, PDFs, imagens para cards)
export const uploadExpositorArquivo = (file, { tipo = "catalogo", titulo } = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (titulo) formData.append("titulo", titulo);
  const q = `tipo=${encodeURIComponent(tipo)}`;
  return api.post(`/expositor/arquivos/upload?${q}`, formData).then((r) => r.data);
};

export const listExpositorArquivos = () =>
  api.get("/expositor/arquivos").then((r) => r.data);

export const deleteExpositorArquivo = (id) =>
  api.delete(`/expositor/arquivos/${id}`);

// Cards do expositor (produtos/serviços/destaques visíveis na página da feira)
export const listExpositorCards = () =>
  api.get("/expositor/cards").then((r) => r.data);

export const createExpositorCard = (data) =>
  api.post("/expositor/cards", data).then((r) => r.data);

export const updateExpositorCard = (id, data) =>
  api.put(`/expositor/cards/${id}`, data).then((r) => r.data);

export const deleteExpositorCard = (id) =>
  api.delete(`/expositor/cards/${id}`);

// Base de conhecimento do expositor (treinamento da IA)
export const listExpositorKnowledge = () =>
  api.get("/expositor/knowledge").then((r) => r.data);

export const createExpositorKnowledgeTexto = (data) =>
  api.post("/expositor/knowledge/texto", data).then((r) => r.data);

export const createExpositorKnowledgeArquivo = (data) =>
  api.post("/expositor/knowledge/arquivo", data).then((r) => r.data);

export const deleteExpositorKnowledge = (id) =>
  api.delete(`/expositor/knowledge/${id}`);

// Banners publicitários (Home / Guia comercial)
export const listBanners = (params = {}) => {
  const q = new URLSearchParams();
  if (params.cityId != null) q.set("cityId", params.cityId);
  if (params.page) q.set("page", params.page);
  if (params.includeInactive === true) q.set("includeInactive", "true");
  const query = q.toString();
  return api.get(`/admin/banners${query ? `?${query}` : ""}`).then((r) => r.data);
};
export const getBanner = (id) => api.get(`/admin/banners/${id}`).then((r) => r.data);
export const createBanner = (data) => api.post("/admin/banners", data).then((r) => r.data);
export const updateBanner = (id, data) => api.put(`/admin/banners/${id}`, data).then((r) => r.data);
export const deleteBanner = (id) => api.delete(`/admin/banners/${id}`);
export const toggleBannerAtivo = (id, ativo) =>
  api.patch(`/admin/banners/${id}/ativo`, { ativo }).then((r) => r.data);

export default api;
