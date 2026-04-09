<script setup>
defineProps({
    users: { type: Array, default: () => [] },
})
</script>

<template>
    <Transition name="typing-fade">
        <div v-if="users.length"
             class="flex items-center gap-2.5 px-5 py-2">

            <!-- Stacked avatars -->
            <div class="flex -space-x-1.5 shrink-0">
                <div v-for="u in users.slice(0, 3)" :key="u.id"
                     class="w-5 h-5 rounded-full border border-panel flex items-center justify-center text-[8px] font-bold text-white"
                     :style="`background: ${u.color}`">
                    {{ u.initials?.slice(0, 1) }}
                </div>
            </div>

            <!-- Dots -->
            <div class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-panel border border-heading/10 shadow-sm">
                <span v-for="i in 3" :key="i"
                      class="w-1.5 h-1.5 rounded-full bg-accent/60 typing-dot"
                      :style="`animation-delay: ${(i - 1) * 0.15}s`" />
            </div>

            <!-- Text -->
            <span class="text-[12px] text-text/55 font-medium italic">
                {{ users.map(u => u.name.split(' ')[0]).join(', ') }}
                {{ users.length === 1 ? 'is' : 'are' }} typing…
            </span>
        </div>
    </Transition>
</template>

<style scoped>
.typing-fade-enter-active, .typing-fade-leave-active { transition: all 0.2s ease; }
.typing-fade-enter-from, .typing-fade-leave-to { opacity: 0; transform: translateY(4px); }

.typing-dot {
    animation: dot-up 0.9s ease-in-out infinite;
}
@keyframes dot-up {
    0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
    30%            { transform: translateY(-4px); opacity: 1; }
}
</style>
