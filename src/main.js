import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { OhVueIcon } from "oh-vue-icons";
import Toastify from 'toastify-js'

import "toastify-js/src/toastify.css"
import '@fontsource-variable/merriweather';
import '@fontsource-variable/manrope';

import { OverlayScrollbars } from 'overlayscrollbars';
import 'overlayscrollbars/overlayscrollbars.css';
import { vScrollbar } from './directives/scrollbar'

import './assets/main.css'

function hideLoader() {
    const loader = document.getElementById('app-loader')
    if (!loader) return
    loader.classList.add('hidden')
    loader.addEventListener('transitionend', () => loader.remove(), { once: true })
    // Belt-and-suspenders: if the transition never fires (e.g. animation
    // disabled), still remove the element after a short delay.
    setTimeout(() => loader.remove(), 1000)
}

function showFatalError(message) {
    hideLoader()
    const el = document.getElementById('app') ?? document.body
    el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Manrope,sans-serif;padding:1rem;">
        <div style="text-align:center;max-width:32rem;">
            <p style="font-size:1.25rem;font-weight:600;color:#ef4444;margin:0 0 0.5rem;">Application failed to start</p>
            <p style="font-size:0.875rem;color:#6b7280;margin:0;">${message}</p>
            <button onclick="location.reload()" style="margin-top:1.5rem;padding:0.5rem 1rem;border:1px solid #d1d5db;border-radius:0.375rem;background:#fff;cursor:pointer;font-family:inherit;">Reload</button>
        </div>
    </div>`
}

const app = createApp(App)

// Global handler for any uncaught error inside Vue components / lifecycle
// hooks. Without this, runtime errors in deep components surface only in
// the console and the user just sees a frozen UI.
app.config.errorHandler = (err, _instance, info) => {
    console.error('[App] Unhandled error:', err, '\nInfo:', info)
}

app.config.globalProperties.$toast = Toastify
app.component("v-icon", OhVueIcon)
app.directive('scrollbar', vScrollbar)

const pinia = createPinia()
app.use(pinia)
app.use(router)

try {
    app.mount('#app')
} catch (err) {
    console.error('[App] Mount failed:', err)
    showFatalError('Please refresh the page or contact your administrator.')
}

router.isReady()
    .then(() => nextTick(hideLoader))
    .catch((err) => {
        console.error('[App] Router ready failed:', err)
        hideLoader()
    })

nextTick(() => {
    try {
        OverlayScrollbars(document.body, {
            scrollbars: {
                clickScroll: true,
                autoHide: "leave",
                dragScrolling: true,
                clickScrolling: true,
            },
            scrollBehavior: 'smooth',
        });
    } catch (err) {
        // Non-fatal: native scrollbars are an acceptable fallback.
        console.warn('[App] OverlayScrollbars init failed:', err)
    }
});
