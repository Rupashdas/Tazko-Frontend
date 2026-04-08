<script setup>
import { ref, nextTick } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import EmojiPickerPanel from '@/components/shared/EmojiPickerPanel.vue'
import { addIcons } from 'oh-vue-icons'
import { BiSend, BiEmojiSmile, BiPaperclip } from 'oh-vue-icons/icons'
addIcons(BiSend, BiEmojiSmile, BiPaperclip)

const store = useChatStore()

const text         = ref('')
const showEmoji    = ref(false)
const textareaRef  = ref(null)
const fileInputRef = ref(null)

function send() {
    const content = text.value.trim()
    if (!content) return
    store.sendMessage(content, 'text')
    text.value = ''
    showEmoji.value = false
    nextTick(() => {
        textareaRef.value?.focus()
        autoResize()
    })
}

function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
    }
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
    const isImage = file.type.startsWith('image/')
    if (isImage) {
        store.sendMessage(file.name, 'image', {
            url: URL.createObjectURL(file),
            content: file.name,
        })
    } else {
        store.sendMessage(file.name, 'file', {
            content: file.name,
            fileSize: formatSize(file.size),
            fileType: file.name.split('.').pop(),
        })
    }
    e.target.value = ''
}

function formatSize(bytes) {
    if (bytes < 1024)       return `${bytes} B`
    if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/(1024*1024)).toFixed(1)} MB`
}

function clickFile() { fileInputRef.value?.click() }
</script>

<template>
    <div class="shrink-0 px-4 pb-4 pt-2">
        <!-- Emoji picker popover (inline above input) -->
        <Transition name="emoji-pop">
            <div v-if="showEmoji"
                 class="mb-2 bg-panel rounded-xl shadow-xl border border-heading/10 overflow-hidden inline-block">
                <EmojiPickerPanel @pick="pickEmoji" />
            </div>
        </Transition>

        <div class="flex items-end gap-2 bg-panel border border-heading/10 rounded-2xl px-3 py-2 shadow-sm focus-within:border-accent/30 focus-within:shadow-accent/5 focus-within:shadow-md transition-all duration-150">
            <!-- Attachment buttons -->
            <div class="flex items-center gap-0.5 pb-1 shrink-0">
                <button @click="clickFile"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-text/50 hover:text-accent hover:bg-accent/8 transition-colors" title="Attach file">
                    <v-icon name="bi-paperclip" scale="0.9" />
                </button>
                <button @click="showEmoji = !showEmoji"
                        class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        :class="showEmoji ? 'text-accent bg-accent/10' : 'text-text/50 hover:text-accent hover:bg-accent/8'"
                        title="Emoji">
                    <v-icon name="bi-emoji-smile" scale="0.9" />
                </button>
            </div>

            <!-- Textarea -->
            <textarea
                ref="textareaRef"
                v-model="text"
                @keydown="onKeydown"
                @input="autoResize"
                placeholder="Type a message… (Shift+Enter for newline)"
                rows="1"
                class="flex-1 resize-none bg-transparent text-sm text-heading placeholder:text-text/35 focus:outline-none leading-relaxed py-1.5"
                style="max-height: 140px; scrollbar-width: thin;"
            />

            <!-- Send button -->
            <button @click="send"
                    :disabled="!text.trim()"
                    class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 mb-0.5"
                    :class="text.trim()
                        ? 'bg-accent text-white hover:bg-accent/85 shadow-sm active:scale-95'
                        : 'bg-heading/8 text-text/30 cursor-not-allowed'">
                <v-icon name="bi-send" scale="0.9" />
            </button>
        </div>

        <!-- Hidden file input -->
        <input ref="fileInputRef" type="file" class="hidden" @change="handleFileUpload" />
    </div>
</template>

<style scoped>
.emoji-pop-enter-active, .emoji-pop-leave-active { transition: all 0.15s ease; }
.emoji-pop-enter-from, .emoji-pop-leave-to { opacity: 0; transform: translateY(6px) scale(0.97); }
</style>
