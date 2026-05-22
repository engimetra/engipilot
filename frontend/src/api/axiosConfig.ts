import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

// Token stocké en mémoire — jamais exposé au localStorage (protection XSS)
let _authToken: string | null = null

export function setAuthToken(token: string): void {
  _authToken = token
}

export function clearAuthToken(): void {
  _authToken = null
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

// Injecter le token JWT sur chaque requête (depuis la mémoire, pas le localStorage)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_authToken) config.headers.Authorization = `Bearer ${_authToken}`
  return config
})

// Vider le token et rediriger vers /login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken()
      if (typeof window !== "undefined") window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
