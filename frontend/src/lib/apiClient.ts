import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

// Injecter le token JWT depuis localStorage sur chaque requête
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Sur 401 : vider la session et rediriger vers /login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      document.cookie = "engipilot_session=; path=/; max-age=0; samesite=lax"
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default apiClient
