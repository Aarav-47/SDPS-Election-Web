import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sdps_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const POST_LABELS = {
  head_boy: "Head Boy",
  head_girl: "Head Girl",
  sports_skipper: "Sports Skipper",
  cultural_head: "Cultural Head",
  discipline_head: "Discipline Head",
};

export const POST_ORDER = [
  "head_boy",
  "head_girl",
  "sports_skipper",
  "cultural_head",
  "discipline_head",
];
