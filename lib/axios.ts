import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // 20 seconds timeout for poor campus networks and DB cold starts
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 1. Session expiration handling
    if (error.response?.status === 401 && !error.response?.data?.requiresLogin) {
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

    // 2. Global Network / 5xx Server Error handling
    if (
      error.code === "ECONNABORTED" ||
      !error.response ||
      error.response?.status >= 500
    ) {
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner")

        const message =
          error.code === "ECONNABORTED"
            ? "Request timed out. Please check your connection."
            : "Network unstable. Please check your connection and try again."

        // Use a static ID to prevent spamming toasts if multiple parallel requests fail
        toast.error(message, {
          id: "network-error",
        })
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
