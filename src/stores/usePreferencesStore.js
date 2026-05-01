import { defineStore } from 'pinia'
import axios from '@/axios'
import { PALETTES } from '@/resources/palettes'
import { useAuthStore } from '@/stores/useAuthStore'


export const usePreferencesStore = defineStore('preferences', {
    state: () => ({
        palette: PALETTES[Object.keys(PALETTES)[0]] ? Object.keys(PALETTES)[0] : null,
        appearance: 'os',
        timezone: 'UTC',
        week_start: 'monday',
        time_format: '24',
        saving: false,
        loaded: false,
    }),

    getters: {
        currentMode: (state) => {
            if (state.appearance === 'dark') return 'dark'
            if (state.appearance === 'light') return 'light'
            return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
        },
    },

    actions: {
        async loadPreferences() {
            try {
                const { data } = await axios.get('/api/preferences')
                this.palette     = data.preference?.palette     ?? this.palette
                this.appearance  = data.preference?.appearance  ?? this.appearance
                this.timezone    = data.preference?.timezone    ?? this.timezone
                this.week_start  = data.preference?.week_start  ?? this.week_start
                this.time_format = data.preference?.time_format ?? this.time_format
            } catch (err) {
                // Non-fatal: keep defaults and continue. App boot must not
                // block on a flaky preferences request.
                console.error('[Preferences] loadPreferences failed:', err)
            } finally {
                this.applyTheme()
                this.loaded = true
            }
        },

        applyTheme() {
            const root = document.documentElement

            // dark class toggle
            root.classList.toggle('dark', this.currentMode === 'dark')

            // palette apply
            const colors = PALETTES[this.palette]?.[this.currentMode]
            if (!colors) return

            Object.entries(colors).forEach(([key, value]) => {
                root.style.setProperty(`--color-${key}`, value)
            })
        },

        async updatePalette(name) {
            // Optimistic UI: theme flips immediately, then sync to server.
            // On failure we revert to the previous value so the persisted
            // state and local state stay aligned.
            const previous = this.palette
            this.palette = name
            this.applyTheme()
            try {
                await axios.post('/api/preferences', { palette: name })
                return { success: true }
            } catch (err) {
                this.palette = previous
                this.applyTheme()
                return {
                    success: false,
                    message: err.response?.data?.message ?? 'Failed to save palette.',
                }
            }
        },

        async updateAppearance(mode) {
            const previous = this.appearance
            this.appearance = mode
            this.applyTheme()
            try {
                await axios.post('/api/preferences', { appearance: mode })
                return { success: true }
            } catch (err) {
                this.appearance = previous
                this.applyTheme()
                return {
                    success: false,
                    message: err.response?.data?.message ?? 'Failed to save appearance.',
                }
            }
        },

        async updateDateTimePreferences() {
            this.saving = true
            try {
                const response = await axios.post('/api/preferences', {
                    timezone:    this.timezone,
                    week_start:  this.week_start,
                    time_format: this.time_format,
                })
                return { success: true, response }
            } catch (err) {
                return {
                    success: false,
                    message: err.response?.data?.message ?? 'Failed to save preferences.',
                    errors:  err.response?.data?.errors ?? null,
                }
            } finally {
                // finally{} guarantees the saving flag clears even when the
                // request rejects, preventing the Save button from staying
                // permanently disabled after an error.
                this.saving = false
            }
        },

        // call this method on app boot
        async loadPreferencesIfLoggedIn() {
            const authStore = useAuthStore()
            if (authStore.isLoggedIn) {
                await this.loadPreferences()
            } else {
                this.applyTheme()
            }
        },
    },
})