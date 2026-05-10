import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    build: {
        // Raise the warning ceiling — see manualChunks below; the per-chunk
        // sizes after splitting are well under this, but the bumped limit
        // keeps the report quiet for the inevitable one-shot growth bursts.
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return
                    // TipTap + ProseMirror are large and only loaded by
                    // RichTextEditor — split them so pages without the editor
                    // ship a smaller initial bundle.
                    if (id.includes('@tiptap') || id.includes('prosemirror-')) return 'tiptap'
                    // Vue / router / pinia change rarely; long-cache them.
                    if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) return 'vue-vendor'
                    // Icon set is bulky and shared across many pages.
                    if (id.includes('oh-vue-icons')) return 'icons'
                    return 'vendor'
                },
            },
        },
    },
})
