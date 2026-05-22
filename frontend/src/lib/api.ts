import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

// Injecter le token JWT sur chaque requête
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("engipilot_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Rediriger vers /login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("engipilot_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
