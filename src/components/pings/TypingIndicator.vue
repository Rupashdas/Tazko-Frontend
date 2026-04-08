<script setup>
defineProps({
    users: { type: Array, default: () => [] }
})
</script>

<template>
    <div v-if="users.length" class="flex items-center gap-2 px-4 py-2">
        <div class="flex items-center gap-0.5">
            <span v-for="i in 3" :key="i" class="typing-dot" :style="`animation-delay: ${(i-1)*0.18}s`" />
        </div>
        <span class="text-sm text-text/70 italic">
            {{ users.map(u => u.name.split(' ')[0]).join(', ') }}
            {{ users.length === 1 ? 'is' : 'are' }} typing…
        </span>
    </div>
</template>

<style scoped>
.typing-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    animation: bounce 0.9s ease-in-out infinite;
    opacity: 0.7;
}

@keyframes bounce {
    0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
    40%            { transform: translateY(-5px); opacity: 1;   }
}
</style>
