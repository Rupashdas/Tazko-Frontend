<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import {
    BiTelephone, BiCameraVideo, BiMic, BiMicMute,
    BiCameraVideoOff, BiTelephoneX, BiDisplay, BiDisplayFill,
} from 'oh-vue-icons/icons'
addIcons(BiTelephone, BiCameraVideo, BiMic, BiMicMute, BiCameraVideoOff, BiTelephoneX, BiDisplay, BiDisplayFill)

const store         = useChatStore()
const micMuted      = ref(false)
const cameraOff     = ref(false)
const screenSharing = ref(false)
const elapsed       = ref(0)
let   _timer        = null

const call       = computed(() => store.callState)
const calleeName = computed(() => {
    if (!call.value) return ''
    return store.convName(store.conversations.find(c => c.id === call.value.conversationId))
})
const calleeUser = computed(() => {
    if (!call.value) return null
    const conv = store.conversations.find(c => c.id === call.value.conversationId)
    if (conv?.type === 'dm') return store.getUser(conv.userId)
    return null
})
const isVideo      = computed(() => call.value?.type === 'video')
const isConnected  = computed(() => call.value?.status === 'connected')

const durationStr = computed(() => {
    const m = Math.floor(elapsed.value / 60).toString().padStart(2, '0')
    const s = (elapsed.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
})

// Start/stop duration timer when connection state changes
watch(isConnected, (v) => {
    if (v) {
        elapsed.value = 0
        _timer = setInterval(() => elapsed.value++, 1000)
    } else {
        clearInterval(_timer)
        _timer = null
    }
})

watch(call, (v) => {
    if (!v) {
        micMuted.value      = false
        cameraOff.value     = false
        screenSharing.value = false
        clearInterval(_timer)
        _timer = null
        elapsed.value = 0
    }
})

onUnmounted(() => clearInterval(_timer))

function endCall() { store.endCall() }
</script>

<template>
    <Transition name="call-fade">
        <div v-if="call"
             class="fixed inset-0 z-[300] flex items-center justify-center"
             style="backdrop-filter: blur(18px) saturate(140%); background: rgba(15,12,40,0.78);">

            <!-- Card -->
            <div class="relative flex flex-col items-center w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
                 style="background: linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%);
                        border: 1px solid rgba(255,255,255,0.12);
                        box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset;">

                <!-- Top gradient bar -->
                <div class="absolute top-0 inset-x-0 h-1 rounded-t-3xl"
                     :style="isVideo
                         ? 'background: linear-gradient(90deg,#6c63ff,#a78bfa)'
                         : 'background: linear-gradient(90deg,#10b981,#34d399)'" />

                <!-- ── Video layout (when video call) ──────────────── -->
                <div v-if="isVideo" class="w-full">
                    <!-- Remote video (simulated) -->
                    <div class="relative w-full h-52 flex items-center justify-center overflow-hidden"
                         style="background: linear-gradient(135deg, #1a1440 0%, #0d0b25 100%);">
                        <div v-if="cameraOff" class="flex flex-col items-center gap-2 opacity-50">
                            <v-icon name="bi-camera-video-off" class="text-white/60" scale="1.8" />
                            <span class="text-white/50 text-xs font-medium">Camera is off</span>
                        </div>
                        <div v-else class="flex flex-col items-center gap-2">
                            <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl"
                                 :style="`background: ${calleeUser?.color ?? '#6c63ff'}`">
                                {{ calleeUser?.initials ?? calleeName.slice(0,2).toUpperCase() }}
                            </div>
                        </div>

                        <!-- Pulse rings when calling -->
                        <div v-if="!isConnected" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div class="pulse-ring" />
                            <div class="pulse-ring" style="animation-delay: 0.6s;" />
                            <div class="pulse-ring" style="animation-delay: 1.2s;" />
                        </div>

                        <!-- Self video (PiP) -->
                        <div class="absolute bottom-3 right-3 w-20 h-[54px] rounded-xl overflow-hidden border-2 border-white/20 shadow-lg"
                             style="background: linear-gradient(135deg, #312e6b 0%, #1a1f4e 100%);">
                            <div class="w-full h-full flex items-center justify-center">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                     :style="`background: ${store.currentUser?.color ?? '#6c63ff'}`">
                                    {{ store.currentUser?.initials }}
                                </div>
                            </div>
                        </div>

                        <!-- Screen sharing badge -->
                        <div v-if="screenSharing"
                             class="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                            <v-icon name="bi-display-fill" scale="0.7" />
                            Sharing screen
                        </div>
                    </div>
                </div>

                <!-- ── Voice layout ──────────────────────────────────── -->
                <div v-else class="pt-10 pb-4 flex flex-col items-center w-full">
                    <!-- Pulse rings -->
                    <div v-if="!isConnected" class="relative flex items-center justify-center mb-4">
                        <div class="pulse-ring-sm" />
                        <div class="pulse-ring-sm" style="animation-delay: 0.5s;" />
                        <div class="pulse-ring-sm" style="animation-delay: 1s;" />
                        <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl relative z-10"
                             :style="`background: ${calleeUser?.color ?? '#6c63ff'}`">
                            {{ calleeUser?.initials ?? calleeName.slice(0,2).toUpperCase() }}
                        </div>
                    </div>
                    <div v-else class="mb-4 relative">
                        <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl ring-2 ring-emerald-400/40"
                             :style="`background: ${calleeUser?.color ?? '#6c63ff'}`">
                            {{ calleeUser?.initials ?? calleeName.slice(0,2).toUpperCase() }}
                        </div>
                        <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white/20 flex items-center justify-center">
                            <v-icon name="bi-telephone" class="text-white" scale="0.55" />
                        </span>
                    </div>
                </div>

                <!-- ── Name + status ──────────────────────────────────── -->
                <div class="flex flex-col items-center gap-1 px-6 pt-4" :class="isVideo ? '' : ''">
                    <h3 class="text-white text-xl font-bold tracking-tight">{{ calleeName }}</h3>
                    <div class="flex items-center gap-1.5">
                        <template v-if="!isConnected">
                            <span class="flex gap-1">
                                <span v-for="i in 3" :key="i"
                                      class="w-[5px] h-[5px] rounded-full bg-white/50 call-dot"
                                      :style="`animation-delay: ${(i-1)*0.2}s`" />
                            </span>
                            <span class="text-white/55 text-[13px]">Calling…</span>
                        </template>
                        <template v-else>
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span class="text-emerald-400 text-[13px] font-semibold tabular-nums"
                                  style="font-family:'Manrope Variable',sans-serif">
                                {{ durationStr }}
                            </span>
                        </template>
                    </div>
                </div>

                <!-- ── Controls ───────────────────────────────────────── -->
                <div class="flex items-center gap-3 px-6 py-6 mt-2">

                    <!-- Mic toggle -->
                    <button @click="micMuted = !micMuted"
                            class="ctrl-btn"
                            :class="micMuted ? 'ctrl-btn--active-red' : 'ctrl-btn--default'"
                            :title="micMuted ? 'Unmute' : 'Mute'">
                        <v-icon :name="micMuted ? 'bi-mic-mute' : 'bi-mic'" scale="1.1" />
                        <span>{{ micMuted ? 'Unmute' : 'Mute' }}</span>
                    </button>

                    <!-- Camera toggle (video only) -->
                    <button v-if="isVideo"
                            @click="cameraOff = !cameraOff"
                            class="ctrl-btn"
                            :class="cameraOff ? 'ctrl-btn--active-red' : 'ctrl-btn--default'"
                            :title="cameraOff ? 'Start camera' : 'Stop camera'">
                        <v-icon :name="cameraOff ? 'bi-camera-video-off' : 'bi-camera-video'" scale="1.0" />
                        <span>{{ cameraOff ? 'Start' : 'Camera' }}</span>
                    </button>

                    <!-- Screen share (video only) -->
                    <button v-if="isVideo"
                            @click="screenSharing = !screenSharing"
                            class="ctrl-btn"
                            :class="screenSharing ? 'ctrl-btn--active-green' : 'ctrl-btn--default'"
                            :title="screenSharing ? 'Stop sharing' : 'Share screen'">
                        <v-icon :name="screenSharing ? 'bi-display-fill' : 'bi-display'" scale="1.0" />
                        <span>{{ screenSharing ? 'Stop' : 'Share' }}</span>
                    </button>

                    <!-- End call -->
                    <button @click="endCall"
                            class="ctrl-btn ctrl-btn--end"
                            title="End call">
                        <v-icon name="bi-telephone-x" scale="1.1" />
                        <span>End</span>
                    </button>
                </div>

            </div>
        </div>
    </Transition>
</template>

<style scoped>
.call-fade-enter-active, .call-fade-leave-active { transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
.call-fade-enter-from, .call-fade-leave-to { opacity: 0; transform: scale(0.95); }

/* Pulse rings – video */
.pulse-ring {
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    border: 1.5px solid rgba(108, 99, 255, 0.3);
    animation: pulse-out 2.4s ease-out infinite;
}
@keyframes pulse-out {
    0%   { transform: scale(0.45); opacity: 0.8; }
    100% { transform: scale(1.3);  opacity: 0; }
}

/* Pulse rings – voice */
.pulse-ring-sm {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 1.5px solid rgba(16, 185, 129, 0.4);
    animation: pulse-out-sm 2s ease-out infinite;
}
@keyframes pulse-out-sm {
    0%   { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2);   opacity: 0; }
}

/* Calling dots */
.call-dot {
    animation: dot-bounce 1.1s ease-in-out infinite;
}
@keyframes dot-bounce {
    0%, 80%, 100% { transform: translateY(0);   opacity: 0.35; }
    40%           { transform: translateY(-4px); opacity: 1; }
}

/* Control buttons */
.ctrl-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    min-width: 60px;
    padding: 10px 12px;
    border-radius: 16px;
    font-size: 0.6875rem;
    font-weight: 600;
    transition: all 0.15s ease;
    color: white;
}
.ctrl-btn:hover { transform: scale(1.06); }
.ctrl-btn:active { transform: scale(0.96); }

.ctrl-btn--default {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.ctrl-btn--default:hover { background: rgba(255, 255, 255, 0.18); }

.ctrl-btn--active-red {
    background: rgba(239, 68, 68, 0.3);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
}
.ctrl-btn--active-green {
    background: rgba(16, 185, 129, 0.25);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #6ee7b7;
}
.ctrl-btn--end {
    background: rgba(239, 68, 68, 0.9);
    border: 1px solid rgba(239, 68, 68, 0.6);
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
    min-width: 68px;
}
.ctrl-btn--end:hover { background: #ef4444; }
</style>
