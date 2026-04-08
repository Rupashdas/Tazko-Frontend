import { defineStore } from 'pinia'
import axios from '@/axios'
import { usePreferencesStore } from '@/stores/usePreferencesStore'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        authChecked: false,
    }),

    getters: {
        isLoggedIn: (state) => !!state.user,

        /**
         * Returns true if the current user has the super-admin role.
         * Super-admins bypass all capability checks.
         */
        isSuperAdmin: (state) => {
            return state.user?.roles?.some(r => r.name === 'super-admin') ?? false
        },

        /**
         * Check if the logged-in user has a specific capability.
         * Capabilities live on the role objects returned from /api/user.
         *
         * Usage:
         *   auth.hasCapability('settings.view')
         *   auth.hasCapability('settings.roles.manage')
         */
        hasCapability: (state) => (capabilityName) => {
            if (!state.user) return false

            // super-admin bypasses all checks
            if (state.user.roles?.some(r => r.name === 'super-admin')) {
                return true
            }

            // Check across all roles
            return state.user.roles?.some(role =>
                role.capabilities?.some(cap => cap.name === capabilityName)
            ) ?? false
        },

        /**
         * Check if the user has any of the given capabilities.
         *
         * Usage:
         *   auth.hasAnyCapability(['settings.view', 'settings.users.view'])
         */
        hasAnyCapability: (state) => (capabilityNames) => {
            if (!state.user) return false

            if (state.user.roles?.some(r => r.name === 'super-admin')) {
                return true
            }

            return state.user.roles?.some(role =>
                role.capabilities?.some(cap => capabilityNames.includes(cap.name))
            ) ?? false
        },
    },

    actions: {
        async login(email, password) {
            try {
                await axios.get('/sanctum/csrf-cookie')
                const { data } = await axios.post('/api/login', { email, password })

                if (data.status === 'success') {
                    this.user = data.user ?? await this.fetchUser()
                    this.authChecked = true
                    return { success: true, message: data.message }
                }
            } catch (err) {
                return {
                    success: false,
                    message: err.response?.data?.message || 'Something went wrong',
                    errors: err.response?.data?.errors || null
                }
            }
        },

        async signup(name, email, password) {
            try {
                await axios.get('/sanctum/csrf-cookie')
                const { data } = await axios.post('/api/register', { name, email, password })

                if (data.status === 'success') {
                    this.user = data.user ?? await this.fetchUser()
                    this.authChecked = true
                    return { success: true, message: data.message }
                }
            } catch (err) {
                return {
                    success: false,
                    message: err.response?.data?.message || 'Something went wrong',
                    errors: err.response?.data?.errors || { general: ['Unknown error occurred'] }
                }
            }
        },

        async logout() {
            try {
                await axios.post('/api/logout')
                this.user = null
                this.authChecked = true

                const preferencesStore = usePreferencesStore()
                preferencesStore.$reset()
                return { success: true }
            } catch (err) {
                this.user = null
                this.authChecked = true

                const preferencesStore = usePreferencesStore()
                preferencesStore.$reset()

                return {
                    success: false,
                    message: err.response?.data?.message || 'Logout failed',
                    errors: err.response?.data?.errors || { general: ['Unknown error occurred'] }
                }
            }
        },

        async fetchUser() {
            try {
                const { data } = await axios.get('/api/user')
                this.user = data.user
                return this.user
            } catch {
                this.user = null
                return null
            } finally {
                this.authChecked = true
            }
        },

        async updateProfile(payload) {
            try {
                const { data } = await axios.post('/api/user', payload)
                if (data.status === 'success') {
                    this.user = data.user
                    return { success: true, message: data.message || 'Profile updated' }
                }
            } catch (err) {
                return {
                    success: false,
                    message: err.response?.data?.message || 'Update failed',
                    errors: err.response?.data?.errors || { general: ['Unknown error occurred'] }
                }
            }
        }
    }
})