<script setup>
import { computed, inject, ref, watch, nextTick } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps({
    editor: { type: Object, required: true },
    node: { type: Object, required: true },
    getPos: { type: Function, required: true },
    selected: { type: Boolean, default: false },
    deleteNode: { type: Function, required: true },
    updateAttributes: { type: Function, required: true },
})

// Provided by RichTextEditor.vue. May be null when InlineImage is rendered
// outside our editor (e.g. read-only view) — fall back to a no-op.
const progressMap = inject('rteUploadProgress', null)

const progress = computed(() => {
    const id = props.node.attrs.tempId
    if (!id || !progressMap) return 0
    return progressMap.get(id) ?? 0
})

const handleRemove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (typeof props.deleteNode === 'function') props.deleteNode()
}

// ── Resize handle ───────────────────────────────────────────
// Width is a node attribute so it round-trips through saved HTML. While the
// user drags, we update a local ref for buttery-smooth resize and only
// commit to the doc on mouseup — that avoids a transaction per mousemove
// (which would thrash onUpdate / draft-save) while still persisting the
// final width.
const imgEl = ref(null)
const dragWidth = ref(null) // px during active drag, null otherwise
const displayWidth = computed(() => {
    if (dragWidth.value != null) return dragWidth.value + 'px'
    return props.node.attrs.width ? props.node.attrs.width + 'px' : null
})

let dragStartX = 0
let dragStartW = 0

function onResizeStart(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!imgEl.value) return
    dragStartX = e.clientX
    dragStartW = imgEl.value.getBoundingClientRect().width
    dragWidth.value = dragStartW
    window.addEventListener('mousemove', onResizeMove)
    window.addEventListener('mouseup', onResizeEnd, { once: true })
}
function onResizeMove(e) {
    // 80px minimum so the user can always grab the handle again. Cap at
    // the editor width so resize can't push content out of view.
    const dx = e.clientX - dragStartX
    const next = Math.max(80, dragStartW + dx)
    const editorEl = props.editor?.view?.dom
    const max = editorEl ? editorEl.getBoundingClientRect().width - 8 : 1200
    dragWidth.value = Math.min(next, max)
}
function onResizeEnd() {
    window.removeEventListener('mousemove', onResizeMove)
    if (dragWidth.value != null) {
        props.updateAttributes({ width: Math.round(dragWidth.value) })
    }
    dragWidth.value = null
}

// ── Alt-text editor ─────────────────────────────────────────
const altInput = ref(null)
const altDraft = ref(props.node.attrs.alt || '')
watch(() => props.node.attrs.alt, (v) => { altDraft.value = v || '' })
watch(() => props.selected, (sel) => {
    // Reset draft to the persisted value when the user re-selects, so a
    // half-typed change from the previous selection isn't carried over.
    if (sel) altDraft.value = props.node.attrs.alt || ''
})
function commitAlt() {
    if ((props.node.attrs.alt || '') !== altDraft.value) {
        props.updateAttributes({ alt: altDraft.value })
    }
}
function onAltKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitAlt(); altInput.value?.blur() }
    if (e.key === 'Escape') { altDraft.value = props.node.attrs.alt || ''; altInput.value?.blur() }
}
</script>

<template>
    <NodeViewWrapper as="span" class="inline-flex items-start flex-col relative"
        :class="{ 'is-selected': selected }"
    >
        <span class="relative inline-block align-middle">
            <img
                v-if="node.attrs.src"
                ref="imgEl"
                :src="node.attrs.src"
                :alt="node.attrs.alt || 'image'"
                class="file-attachment-image rounded-md object-contain block"
                :style="displayWidth ? { width: displayWidth, maxWidth: '100%', maxHeight: '640px' } : { maxWidth: '100%', maxHeight: '320px' }"
                :class="{ 'opacity-80': node.attrs.uploading }"
            />
            <!-- Progress bar overlay along the bottom edge of the image. -->
            <span
                v-if="node.attrs.uploading"
                class="upload-bar"
                contenteditable="false"
            >
                <span
                    class="upload-bar-fill"
                    :style="{ width: progress + '%' }"
                ></span>
            </span>
            <!-- Resize handle, bottom-right corner. Only shown when selected
                 and not uploading (no point letting the user resize a placeholder
                 — width would be locked in before the real image loads). -->
            <span
                v-if="selected && !node.attrs.uploading"
                class="resize-handle"
                contenteditable="false"
                title="Drag to resize"
                @mousedown="onResizeStart"
            ></span>
            <!-- Delete button -->
            <button
                type="button"
                class="delete-btn"
                :class="{ 'is-shown': selected }"
                contenteditable="false"
                @click="handleRemove"
                title="Remove image"
            >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                </svg>
            </button>
        </span>
        <!-- Alt-text editor: visible only when selected. Inline so it doesn't
             take vertical space when not in use. Persists on blur or Enter. -->
        <span v-if="selected" class="alt-row" contenteditable="false">
            <span class="alt-label">Alt</span>
            <input
                ref="altInput"
                v-model="altDraft"
                type="text"
                class="alt-input"
                placeholder="Describe the image (for screen readers)"
                @blur="commitAlt"
                @keydown="onAltKeydown"
                @mousedown.stop
            />
        </span>
    </NodeViewWrapper>
</template>

<style scoped>
.inline-image-wrapper {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    vertical-align: middle;
    position: relative;
}
.inline-image-frame {
    position: relative;
    line-height: 0;
}
.inline-image-wrapper.is-selected .inline-image-frame {
    outline: 2px solid var(--color-accent, #6366f1);
    outline-offset: 2px;
    border-radius: 6px;
}
.upload-bar {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 4px;
    background: rgba(0,0,0,0.3);
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    overflow: hidden;
    pointer-events: none;
}
.upload-bar-fill {
    display: block;
    height: 100%;
    background: var(--color-accent, #6366f1);
    transition: width 0.15s linear;
}
.resize-handle {
    position: absolute;
    right: -6px; bottom: -6px;
    width: 12px; height: 12px;
    background: var(--color-accent, #6366f1);
    border: 2px solid #fff;
    border-radius: 2px;
    cursor: nwse-resize;
    z-index: 3;
    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.delete-btn {
    position: absolute;
    top: -6px; right: -6px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.8);
    color: #fff;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0;
    z-index: 2;
    transition: background 0.15s;
}
.delete-btn:hover { background: rgb(239, 68, 68); }
.inline-image-wrapper:hover .delete-btn,
.delete-btn.is-shown { display: inline-flex; }
.alt-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding: 3px 6px;
    background: color-mix(in srgb, var(--color-heading, #111) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-heading, #111) 10%, transparent);
    border-radius: 4px;
    font-size: 0.72rem;
    line-height: 1.2;
    max-width: 100%;
}
.alt-label {
    font-weight: 700;
    color: color-mix(in srgb, var(--color-text, #333) 55%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.62rem;
}
.alt-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.78rem;
    color: var(--color-text, #333);
    min-width: 220px;
    padding: 1px 0;
}
.alt-input::placeholder {
    color: color-mix(in srgb, var(--color-text, #333) 35%, transparent);
}
</style>
