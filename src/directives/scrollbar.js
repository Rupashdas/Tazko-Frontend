import { OverlayScrollbars } from 'overlayscrollbars'

const SCROLLBAR_OPTIONS = {
    scrollbars: {
        clickScroll:    true,
        autoHide:       'leave',
        dragScrolling:  true,
    },
}

export const vScrollbar = {
    mounted(el) {
        OverlayScrollbars(el, SCROLLBAR_OPTIONS)
    },
    unmounted(el) {
        const instance = OverlayScrollbars(el)
        instance?.destroy()
    },
}
