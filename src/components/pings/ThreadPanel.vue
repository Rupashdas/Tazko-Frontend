<script setup>
import { ref, nextTick } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import { MdCloseRound, BiChatSquareDots, BiSend } from 'oh-vue-icons/icons'
addIcons(MdCloseRound, BiChatSquareDots, BiSend)

const store  = useChatStore()
const reply  = ref('')
const taRef  = ref(null)

function sendReply() {
    const content = reply.value.trim()
    if (!content) return
    store.sendThreadReply(content)
    reply.value = ''
    nextTick(() => taRef.value?.focus())
}

function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
}

function getUser(id) { return store.getUser(id) }
</script>

<template>
    <Transition name="thread-slide">
        <aside v-if="store.activeThread"
               class="flex flex-col border-l border-heading/8 bg-panel overflow-hidden shrink-0"
               class="w-[320px] min-w-[320px]">

            <!-- ── Header ──────────────────────────────────────── -->
            <div class="flex items-center justify-between px-4 py-3.5 border-b border-heading/8 shrink-0">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                        <v-icon name="bi-chat-square-dots" class="text-accent" scale="0.8" />
                    </div>
                    <span class="text-[14px] font-bold text-heading">Thread</span>
                </div>
                <button @click="store.closeThread()"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-text/40
                               hover:bg-heading/8 hover:text-heading transition-all duration-150 active:scale-95">
                    <v-icon name="md-close-round" scale="0.88" />
                </button>
            </div>

            <!-- ── Parent message ─────────────────────────────── -->
            <div v-if="store.threadParent"
                 class="mx-3 my-3 px-3 py-3 rounded-xl bg-heading/4 border border-heading/8 shrink-0">
                <div class="flex items-start gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                         :style="`background: ${getUser(store.threadParent.senderId)?.color ?? '#6c63ff'}`">
                        {{ getUser(store.threadParent.senderId)?.initials }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-baseline gap-1.5 mb-0.5">
                            <p class="text-[12px] font-bold text-heading">
                                {{ getUser(store.threadParent.senderId)?.name }}
                            </p>
                            <span class="text-[10px] text-text/35 tabular-nums">
                                {{ store.threadParent.time }}
                            </span>
                        </div>
                        <p class="text-[12px] text-text leading-relaxed line-clamp-3 break-words">
                            {{ store.threadParent.content }}
                        </p>
                        <img v-if="store.threadParent.type === 'image'"
                             :src="store.threadParent.url"
                             class="mt-2 rounded-lg max-h-28 object-cover" />
                    </div>
                </div>
            </div>

            <!-- Thread divider -->
            <div class="flex items-center gap-2.5 px-4 pb-1 shrink-0">
                <div class="flex-1 h-px bg-heading/8" />
                <span class="text-[10px] font-bold uppercase tracking-widest text-text/35">
                    {{ store.threadReplies.length }} {{ store.threadReplies.length === 1 ? 'Reply' : 'Replies' }}
                </span>
                <div class="flex-1 h-px bg-heading/8" />
            </div>

            <!-- ── Replies list ────────────────────────────────── -->
            <div v-scrollbar class="flex-1 overflow-y-auto"><div class="px-3 py-2 space-y-3">
                <div v-if="!store.threadReplies.length"
                     class="flex flex-col items-center gap-2 py-8 text-center">
                    <span class="text-2xl opacity-30">💬</span>
                    <p class="text-[12px] text-text/40 font-medium">No replies yet.<br>Be the first!</p>
                </div>

                <TransitionGroup name="thread-msg" tag="div" class="space-y-3">
                    <div v-for="msg in store.threadReplies" :key="msg.id"
                         class="flex items-start gap-2.5 group">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5"
                             :style="`background: ${getUser(msg.senderId)?.color ?? '#6c63ff'}`">
                            {{ getUser(msg.senderId)?.initials }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-baseline gap-1.5 mb-0.5">
                                <span class="text-[12px] font-bold text-heading">
                                    {{ msg.senderId === store.CURRENT_USER_ID ? 'You' : getUser(msg.senderId)?.name }}
                                </span>
                                <span class="text-[10px] text-text/30 tabular-nums">
                                    {{ msg.time }}
                                </span>
                            </div>
                            <div class="px-3 py-2 rounded-xl rounded-tl-sm bg-body border border-heading/8 text-[13px] text-heading leading-relaxed break-words">
                                {{ msg.content }}
                            </div>
                        </div>
                    </div>
                </TransitionGroup>
            </div></div>

            <!-- ── Reply input ────────────────────────────────── -->
            <div class="px-3 pb-3 pt-2 border-t border-heading/8 shrink-0">
                <div class="flex items-end gap-2 bg-body rounded-xl border border-heading/10 px-3 py-2
                            focus-within:border-accent/35 focus-within:ring-2 focus-within:ring-accent/8 transition-all duration-150">
                    <textarea
                        ref="taRef"
                        v-model="reply"
                        @keydown="onKey"
                        rows="1"
                        placeholder="Reply in thread…"
                        class="flex-1 resize-none bg-transparent text-[13px] text-heading placeholder:text-text/30
                               focus:outline-none leading-relaxed py-1 max-h-24 [scrollbar-width:thin]"
                    />
                    <button @click="sendReply"
                            :disabled="!reply.trim()"
                            class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 active:scale-95"
                            :class="reply.trim()
                                ? 'bg-accent text-white hover:bg-accent/85 shadow-sm'
                                : 'bg-heading/8 text-text/25 cursor-not-allowed'">
                        <v-icon name="bi-send" scale="0.82" />
                    </button>
                </div>
                <p class="text-[10px] text-text/30 mt-1.5 px-0.5">
                    <kbd class="px-1 py-0.5 rounded bg-heading/8 font-mono text-[9px] text-text/35">Enter</kbd> to reply
                </p>
            </div>
        </aside>
    </Transition>
</template>

<style scoped>
.thread-slide-enter-active, .thread-slide-leave-active { transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.thread-slide-enter-from, .thread-slide-leave-to { transform: translateX(100%); opacity: 0; }

.thread-msg-enter-active { transition: all 0.18s ease; }
.thread-msg-enter-from   { opacity: 0; transform: translateY(4px); }
</style>
