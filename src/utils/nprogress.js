import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
    showSpinner: false,
    trickleSpeed: 180,
    minimum: 0.12,
    easing: 'ease',
    speed: 320,
})

// Single shared counter so router navigation and the data fetches it triggers
// render as ONE continuous bar instead of finishing-then-restarting.
//
// When the counter drops to 0 we don't call NProgress.done() immediately —
// we wait GRACE_MS so a follow-up begin() (e.g. the new page's onMounted
// fetch firing AFTER the router-view's <transition mode="out-in"> swap) can
// extend the same bar instead of starting a second animation.
let pending = 0
let doneTimer = null
const GRACE_MS = 300

export function begin() {
    if (doneTimer) {
        clearTimeout(doneTimer)
        doneTimer = null
    }
    if (pending === 0) NProgress.start()
    pending++
}

export function end() {
    pending = Math.max(0, pending - 1)
    if (pending !== 0) return
    if (doneTimer) clearTimeout(doneTimer)
    doneTimer = setTimeout(() => {
        doneTimer = null
        if (pending === 0) NProgress.done()
    }, GRACE_MS)
}

export default NProgress
