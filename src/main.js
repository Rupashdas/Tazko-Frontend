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

import './assets/main.css'

const app = createApp(App)

app.config.globalProperties.$toast = Toastify
app.component("v-icon", OhVueIcon);

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

router.isReady().then(() => {
    nextTick(() => {
        const loader = document.getElementById('app-loader')
        if (loader) {
            loader.classList.add('hidden')
            // Remove from DOM after transition ends
            loader.addEventListener('transitionend', () => loader.remove(), { once: true })
        }
    })
})

nextTick(() => {
    OverlayScrollbars(document.body, {
        scrollbars: {
            clickScroll: true,
            autoHide: "leave",
            dragScrolling: true,
            clickScrolling: true,
        },
        scrollBehavior: 'smooth',
    });
});