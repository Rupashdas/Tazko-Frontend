<script setup>
import { ref, nextTick, computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import EmojiPickerPanel from '@/components/shared/EmojiPickerPanel.vue'
import { addIcons } from 'oh-vue-icons'
import {
    BiSend, BiEmojiSmile, BiPaperclip,
    BiTypeBold, BiTypeItalic, BiCode, BiAt, BiX,
} from 'oh-vue-icons/icons'
addIcons(BiSend, BiEmojiSmile, BiPaperclip, BiTypeBold, BiTypeItalic, BiCode, BiAt, BiX)

const store        = useChatStore()
const text         = ref('')
const showEmoji    = ref(false)
const textareaRef  = ref(null)
const fileInputRef = ref(null)

const replyingTo   = computed(() => store.replyingTo)

function send() {
    const content = text.value.trim()
    if (!content) return
    store.sendMessage(content, 'text')  // store.sendMessage clears replyingTo internally
    text.value      = ''
    showEmoji.value = false
    nextTick(() => { textareaRef.value?.focus(); autoResize() })
}

function cancelReply() {
    store.clearReplyTo()
}

function onKeydown(e) {
    if (e.key === 'Escape') { cancelReply(); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

function pickEmoji(emoji) {
    text.value += emoji
    showEmoji.value = false
    nextTick(() => textareaRef.value?.focus())
}

function autoResize() {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
}

function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
        store.sendMessage(file.name, 'image', { url: URL.createObjectURL(file), content: file.name })
    } else {
        store.sendMessage(file.name, 'file', {
            content:  file.name,
            fileSize: formatSize(file.size),
            fileType: file.name.split('.').pop(),
        })
    }
    e.target.value = ''
}

function formatSize(b) {
    if (b < 1024)     return `${b} B`
    if (b < 1048576)  return `${(b/1024).toFixed(1)} KB`
    return `${(b/1048576).toFixed(1)} MB`
}

function insertFormat(open, close = open) {
    const el = textareaRef.value
    if (!el) return
    const s   = el.selectionStart
    const e2  = el.selectionEnd
    const sel = text.value.slice(s, e2)
    text.value = text.value.slice(0, s) + open + sel + close + text.value.slice(e2)
    nextTick(() => {
        el.focus()
        el.selectionStart = s + open.length
        el.selectionEnd   = s + open.length + sel.length
        autoResize()
    })
}
</script>

<template>
    <div class="shrink-0 px-4 pb-4 pt-1">

        <!-- Emoji picker -->
        <Transition name="emoji-pop">
            <div v-if="showEmoji"
                 class="mb-2 bg-panel rounded-2xl shadow-xl border border-heading/10 overflow-hidden inline-block">
                <EmojiPickerPanel @pick="pickEmoji" />
            </div>
        </Transition>

        <!-- Composer card -->
        <div class="rounded-2xl border border-heading/12 bg-panel shadow-sm
                    focus-within:border-accent/35 focus-within:shadow-accent/8 focus-within:shadow-md
                    transition-all duration-200 overflow-hidden">

            <!-- ── Reply preview strip ─────────────────────────── -->
            <Transition name="reply-strip">
                <div v-if="replyingTo"
                     class="flex items-center gap-2.5 px-3 pt-2.5 pb-2 border-b border-heading/8">
                    <div class="flex-1 min-w-0 flex items-start gap-2 pl-2 border-l-2 border-accent/50">
                        <div class="min-w-0 flex-1">
                            <p class="text-[11px] font-bold text-accent">
                                Replying to {{ replyingTo.senderId === store.CURRENT_USER_ID ? 'yourself' : replyingTo.senderName }}
                            </p>
                            <p class="text-[12px] text-text/60 truncate">{{ replyingTo.content }}</p>
                        </div>
                    </div>
                    <button @click="cancelReply"
                            class="w-6 h-6 rounded-md flex items-center justify-center text-text/40
                                   hover:bg-heading/8 hover:text-heading transition-all shrink-0"
                            title="Cancel reply">
                        <v-icon name="bi-x" scale="0.85" />
                    </button>
                </div>
            </Transition>

            <!-- ── Formatting toolbar ──────────────────────────── -->
            <div class="flex items-center gap-0.5 px-3 pt-2.5 pb-1 border-b border-heading/6">
                <button @click="insertFormat('**')"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text/45 hover:bg-heading/8 hover:text-heading transition-all duration-100" title="Bold">
                    <v-icon name="bi-type-bold" scale="0.85" />
                </button>
                <button @click="insertFormat('_')"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text/45 hover:bg-heading/8 hover:text-heading transition-all duration-100" title="Italic">
                    <v-icon name="bi-type-italic" scale="0.85" />
                </button>
                <button @click="insertFormat('`')"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text/45 hover:bg-heading/8 hover:text-heading transition-all duration-100" title="Inline code">
                    <v-icon name="bi-code" scale="0.85" />
                </button>
                <div class="w-px h-4 bg-heading/10 mx-1" />
                <button @click="text += '@'"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text/45 hover:bg-heading/8 hover:text-heading transition-all duration-100" title="Mention someone">
                    <v-icon name="bi-at" scale="0.85" />
                </button>
            </div>

            <!-- ── Text area row ───────────────────────────────── -->
            <div class="flex items-end gap-2 px-3 py-2">
                <div class="flex items-center gap-0.5 pb-1 shrink-0">
                    <button @click="fileInputRef?.click()"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-text/45
                                   hover:text-accent hover:bg-accent/8 transition-all duration-100 active:scale-95"
                            title="Attach file">
                        <v-icon name="bi-paperclip" scale="0.88" />
                    </button>
                    <button @click="showEmoji = !showEmoji"
                            class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-100 active:scale-95"
                            :class="showEmoji ? 'text-accent bg-accent/10' : 'text-text/45 hover:text-accent hover:bg-accent/8'"
                            title="Emoji">
                        <v-icon name="bi-emoji-smile" scale="0.88" />
                    </button>
                </div>

                <textarea
                    ref="textareaRef"
                    v-model="text"
                    @keydown="onKeydown"
                    @input="autoResize"
                    :placeholder="replyingTo ? `Reply to ${replyingTo.senderName}…` : 'Type a message… (Shift+Enter for new line)'"
                    rows="1"
                    class="flex-1 resize-none bg-transparent text-[14px] text-heading
                           placeholder:text-text/30 focus:outline-none leading-relaxed py-1.5
                           [scrollbar-width:thin] max-h-[140px]"
                />

                <button @click="send"
                        :disabled="!text.trim()"
                        class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 mb-0.5"
                        :class="text.trim()
                            ? 'bg-accent text-white hover:bg-accent/85 shadow-sm shadow-accent/30 active:scale-95'
                            : 'bg-heading/8 text-text/25 cursor-not-allowed'">
                    <v-icon name="bi-send" scale="0.88" />
                </button>
            </div>

            <!-- ── Hint bar ─────────────────────────────────────── -->
            <div class="px-3 pb-2 flex items-center gap-2">
                <span class="text-[10px] text-text/30 font-medium">
                    <kbd class="px-1 py-0.5 rounded bg-heading/8 text-text/35 font-mono text-[9px]">Enter</kbd> Send ·
                    <kbd class="px-1 py-0.5 rounded bg-heading/8 text-text/35 font-mono text-[9px]">Shift+Enter</kbd> Newline
                    <template v-if="replyingTo"> ·
                        <kbd class="px-1 py-0.5 rounded bg-heading/8 text-text/35 font-mono text-[9px]">Esc</kbd> Cancel reply
                    </template>
                </span>
            </div>
        </div>

        <input ref="fileInputRef" type="file" class="hidden" @change="handleFileUpload" />
    </div>
</template>

<style scoped>

.emoji-pop-enter-active, .emoji-pop-leave-active { transition: all 0.15s ease; }
.emoji-pop-enter-from,   .emoji-pop-leave-to     { opacity: 0; transform: translateY(6px) scale(0.97); }

.reply-strip-enter-active, .reply-strip-leave-active { transition: all 0.18s ease; overflow: hidden; }
.reply-strip-enter-from,   .reply-strip-leave-to     { opacity: 0; max-height: 0; }
.reply-strip-enter-to,     .reply-strip-leave-from   { max-height: 80px; }
</style>
