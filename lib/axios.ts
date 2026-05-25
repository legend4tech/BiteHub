import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner")
        const { signOut } = await import("next-auth/react")

        // Prevent duplicate toasts if multiple requests fail at once
        toast.error("Session expired. Please login again.", {
          id: "session-expired",
        })

        // Redirect to the current URL so middleware can decide the appropriate login page
        // (or let them stay on the page if it's a public route).
        signOut({ callbackUrl: window.location.href })

        // Return a pending promise so the component's catch block doesn't execute
        // while the page is redirecting to login. This prevents the double toast!
        return new Promise(() => {})
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
