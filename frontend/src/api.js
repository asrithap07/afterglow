import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;
export const ASSETS = `${BASE}`;

const inst = axios.create({ baseURL: API, withCredentials: true });
inst.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("ag_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const api = {
  register: (d) => inst.post("/auth/register", d).then((r) => r.data),
  login: (d) => inst.post("/auth/login", d).then((r) => r.data),
  logout: () => inst.post("/auth/logout"),
  me: () => inst.get("/auth/me").then((r) => r.data),

  upload: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return inst.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },

  listScrapbooks: () => inst.get("/scrapbooks").then((r) => r.data),
  createScrapbook: (d) => inst.post("/scrapbooks", d).then((r) => r.data),
  getScrapbook: (id) => inst.get(`/scrapbooks/${id}`).then((r) => r.data),
  updateScrapbook: (id, d) => inst.put(`/scrapbooks/${id}`, d).then((r) => r.data),
  deleteScrapbook: (id) => inst.delete(`/scrapbooks/${id}`).then((r) => r.data),

  getHome: () => inst.get("/home").then((r) => r.data),
  updateHome: (items) => inst.put("/home", { items }).then((r) => r.data),
  seedDemo: () => inst.post("/seed-demo").then((r) => r.data),
};

export const fmtErr = (e) => {
  const d = e?.response?.data?.detail;
  if (!d) return e.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(" ");
  return JSON.stringify(d);
};
