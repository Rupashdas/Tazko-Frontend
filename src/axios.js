import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true

/**
 * Global response interceptor.
 *
 * If the server returns 403 with code === 'account_deactivated',
 * it means the user was active when they logged in but has since been
 * deactivated by an admin. We:
 *   1. Clear the Pinia auth store so isLoggedIn becomes false
 *   2. Redirect to /login with a query param so the login page can
 *      show a contextual error message
 *
 * We import the store lazily (inside the interceptor) to avoid the
 * circular-dependency issue that occurs when axios.js is imported
 * before Pinia is fully initialised.
 */
axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const data = error.response?.data

		if (
			error.response?.status === 403 &&
			data?.code === 'account_deactivated'
		) {
			// Lazy import to avoid circular dependency at module load time
			const { useAuthStore } = await import('@/stores/useAuthStore')
			const auth = useAuthStore()

			// Wipe local auth state (no API call needed — session is already
			// destroyed server-side by EnsureUserIsActive)
			auth.user = null
			auth.authChecked = true

			// Redirect to login with a flag the login page can read
			window.location.href = '/login?reason=deactivated'

			// Prevent the original caller from also handling the error
			return new Promise(() => { })
		}

		return Promise.reject(error)
	}
)

export default axios