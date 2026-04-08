<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import { BiTelephone, BiCameraVideo, BiMicMute, BiCameraVideoOff, BiTelephoneX } from 'oh-vue-icons/icons'
addIcons(BiTelephone, BiCameraVideo, BiMicMute, BiCameraVideoOff, BiTelephoneX)

const store = useChatStore()

const call = computed(() => store.callState)

const calleeName = computed(() => {
    if (!call.value) return ''
    return store.convName(store.conversations.find(c => c.id === call.value.conversationId))
})

const calleeUser = computed(() => {
    if (!call.value) return null
    const conv = store.conversations.find(c => c.id === call.value.conversationId)
    if (!conv) return null
    if (conv.type === 'dm') return store.getUser(conv.userId)
    return null
})

const statusLabel = computed(() => {
    if (!call.value) return ''
    return call.value.status === 'calling' ? 'Calling…' : 'Connected'
})
</script>

<template>
    <Transition name="call-fade">
        <div v-if="call" class="fixed inset-0 z-[200] flex items-center justify-center" style="backdrop-filter: blur(12px); background: rgba(10,8,30,0.72);">
            <div class="relative flex flex-col items-center gap-6 px-10 py-10 rounded-sm"
                 style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); min-width: 300px;">

                <!-- Pulse rings -->
                <div v-if="call.status === 'calling'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="pulse-ring" />
                    <div class="pulse-ring" style="animation-delay: 0.5s;" />
                </div>

                <!-- Icon: video or voice -->
                <div class="w-16 h-16 rounded-full flex items-center justify-center mb-1"
                     :style="call.type === 'video' ? 'background: rgba(108,99,255,0.3)' : 'background: rgba(16,185,129,0.3)'">
                    <v-icon :name="call.type === 'video' ? 'bi-camera-video' : 'bi-telephone'"
                            class="text-white" scale="1.6" />
                </div>

                <!-- Avatar -->
                <div class="flex flex-col items-center gap-3 z-10">
                    <div class="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl"
                         :style="calleeUser ? `background: ${calleeUser.color}` : 'background: #6c63ff'">
                        {{ calleeUser?.initials ?? calleeName.slice(0,2).toUpperCase() }}
                    </div>
                    <div class="text-center">
                        <p class="text-white text-xl font-bold">{{ calleeName }}</p>
                        <p class="text-white/60 text-sm mt-1 flex items-center gap-1.5">
                            <span v-if="call.status === 'calling'" class="inline-flex gap-0.5">
                                <span v-for="i in 3" :key="i" class="calling-dot" :style="`animation-delay:${(i-1)*0.2}s`" />
                            </span>
                            {{ statusLabel }}
                        </p>
                    </div>
                </div>

                <!-- Controls -->
                <div class="flex items-center gap-4 z-10 mt-2">
                    <button class="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white" title="Mute">
                        <v-icon name="bi-mic-mute" scale="1.1" />
                    </button>
                    <button v-if="call.type === 'video'"
                            class="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white" title="Camera off">
                        <v-icon name="bi-camera-video-off" scale="1.1" />
                    </button>
                    <button @click="store.endCall()"
                            class="w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                            style="background: #ef4444;" title="End call">
                        <v-icon name="bi-telephone-x" scale="1.2" />
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.call-fade-enter-active, .call-fade-leave-active { transition: all 0.25s ease; }
.call-fade-enter-from, .call-fade-leave-to { opacity: 0; transform: scale(0.96); }

.pulse-ring {
    position: absolute;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    border: 1.5px solid rgba(108,99,255,0.35);
    animation: pulse-expand 2s ease-out infinite;
}

@keyframes pulse-expand {
    0%   { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
}

.calling-dot {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.6);
    animation: dot-bounce 1s ease-in-out infinite;
}
@keyframes dot-bounce {
    0%,80%,100% { transform: translateY(0); opacity: 0.4; }
    40%         { transform: translateY(-4px); opacity: 1; }
}
</style>
