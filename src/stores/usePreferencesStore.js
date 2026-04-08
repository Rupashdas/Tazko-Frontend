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
            const { data } = await axios.get('/api/preferences')
            // handle if data.preference is null (should not happen but just in case)

            this.palette = data.preference?.palette ?? this.palette
            this.appearance = data.preference?.appearance ?? this.appearance
            this.timezone = data.preference?.timezone ?? this.timezone
            this.week_start = data.preference?.week_start ?? this.week_start
            this.time_format = data.preference?.time_format ?? this.time_format

            this.applyTheme()
            this.loaded = true
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

        updatePalette(name) {
            axios.post('/api/preferences', { palette: name })
            this.palette = name
            this.applyTheme()
        },

        updateAppearance(mode) {
            axios.post('/api/preferences', { appearance: mode })
            this.appearance = mode
            this.applyTheme()
        },

        async updateDateTimePreferences() {
            this.saving = true
            const response = await axios.post('/api/preferences', {
                timezone: this.timezone,
                week_start: this.week_start,
                time_format: this.time_format,
            })
            this.saving = false
            return response
        },
        // call this method on app boot
        async loadPreferencesIfLoggedIn() {
            const authStore = useAuthStore()
            if (authStore.isLoggedIn) {
                console.log("loading preferences")
                await this.loadPreferences()
            } else {
                this.applyTheme()
            }
        },
    },
})