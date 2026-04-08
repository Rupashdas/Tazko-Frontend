<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import Logo from "@/components/icons/Logo.vue";

const route = useRoute()

const panelContent = computed(() => {
    const map = {
        login: {
            eyebrow: 'Welcome back',
            title: 'Let\'s Get\nThings Done',
            subtitle: 'Log in to sync with your team, track milestones, and keep every project on course.',
            stats: [
                { value: '10k+', label: 'Teams' },
                { value: '99.9%', label: 'Uptime' },
                { value: '4.9★', label: 'Rating' },
            ],
        },
        signup: {
            eyebrow: 'Get started free',
            title: 'Build Something\nAmazing',
            subtitle: 'Join thousands of teams who use Tazko to collaborate, ship faster, and stay aligned.',
            stats: [
                { value: 'Free', label: 'Forever Plan' },
                { value: '5 min', label: 'Setup Time' },
                { value: '24/7', label: 'Support' },
            ],
        },
        'forgot-password': {
            eyebrow: 'Account recovery',
            title: 'We\'ve Got\nYou Covered',
            subtitle: 'Forgot your password? No worries — we\'ll get you back on track in seconds.',
            stats: [
                { value: '< 1min', label: 'Reset Time' },
                { value: 'Secure', label: 'Email Link' },
                { value: '24/7', label: 'Support' },
            ],
        },
        'reset-password': {
            eyebrow: 'New password',
            title: 'Almost\nThere',
            subtitle: 'Create a strong new password to keep your Tazko account safe and secure.',
            stats: [
                { value: 'AES-256', label: 'Encryption' },
                { value: 'Secure', label: 'Storage' },
                { value: '24/7', label: 'Support' },
            ],
        },
    }
    return map[route.name] ?? map.login
})

const tasks = [
    { label: 'Design system audit', tag: 'Active', color: 'bg-accent', progress: 80 },
    { label: 'API integration review', tag: 'Review', color: 'bg-emerald-400', progress: 55 },
    { label: 'Q4 roadmap planning', tag: 'Pending', color: 'bg-amber-400', progress: 30 },
]
</script>

<template>
    <div class="min-h-screen flex bg-body">

        <!-- ─── Left Brand Panel ────────────────────────────── -->
        <aside
            class="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col justify-between p-12 xl:p-16"
            style="background: linear-gradient(145deg, #0e1340 0%, #1a1f4e 60%, #2a1f6e 100%);">

            <!-- Radial glow blobs -->
            <div class="pointer-events-none absolute inset-0 overflow-hidden">
                <div class="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full"
                    style="background: radial-gradient(circle, rgba(108,99,255,0.35) 0%, transparent 65%);" />
                <div class="absolute top-1/2 -right-24 w-[340px] h-[340px] rounded-full"
                    style="background: radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 65%);" />
                <div class="absolute -bottom-32 left-1/3 w-[300px] h-[300px] rounded-full"
                    style="background: radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 65%);" />
                <!-- Dot grid -->
                <div class="absolute inset-0 opacity-[0.04]"
                    style="background-image: radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px); background-size: 28px 28px;" />
            </div>

            <!-- Logo -->
            <div class="relative z-10">
                <router-link :to="{ name: 'home' }" class="inline-flex items-center gap-2 group">
                    <Logo class="h-8 w-auto" />
                </router-link>
            </div>

            <!-- Hero text -->
            <div class="relative z-10 flex flex-col gap-8">
                <!-- Eyebrow -->
                <div class="inline-flex items-center gap-2 w-fit">
                    <span class="w-5 h-px bg-accent/60" />
                    <span class="text-sm font-semibold tracking-[0.18em] uppercase text-accent/80">
                        {{ panelContent.eyebrow }}
                    </span>
                </div>

                <!-- Title -->
                <h1 class="text-white font-display leading-[1.08] whitespace-pre-line"
                    style="font-size: clamp(2.6rem, 4vw, 3.8rem); letter-spacing: 0.01em;">
                    {{ panelContent.title }}
                </h1>

                <!-- Subtitle -->
                <p class="text-white/50 text-base leading-relaxed max-w-xs">
                    {{ panelContent.subtitle }}
                </p>

                <!-- Stats row -->
                <div class="flex gap-8 pt-2">
                    <div v-for="stat in panelContent.stats" :key="stat.label" class="flex flex-col gap-1">
                        <span class="text-2xl font-bold font-display text-accent leading-none">{{ stat.value }}</span>
                        <span class="text-sm uppercase tracking-[0.14em] text-white/35 font-medium">{{ stat.label
                        }}</span>
                    </div>
                </div>

                <!-- Fake task cards -->
                <div class="flex flex-col gap-2.5 pt-2">
                    <div v-for="(task, i) in tasks" :key="i"
                        class="flex items-center gap-3 rounded-sm px-4 py-3 border border-white/10 backdrop-blur-sm transition-all duration-500"
                        :class="i === 0 ? 'bg-white/10' : 'bg-white/[0.04]'">
                        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="task.color" />
                        <span class="flex-1 text-base text-white/70 truncate">{{ task.label }}</span>
                        <span class="text-sm font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/40">
                            {{ task.tag }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="relative z-10">
                <p class="text-white/20 text-sm tracking-wide">© 2025 Tazko — All rights reserved.</p>
            </div>
        </aside>

        <!-- ─── Right Form Panel ───────────────────────────── -->
        <main class="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 py-12 min-h-screen">
            <!-- Subtle bg circles -->
            <div class="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-40"
                style="background: radial-gradient(circle, #e0e7ff 0%, transparent 70%);" />
            <div class="pointer-events-none absolute -bottom-16 -left-16 w-52 h-52 rounded-full opacity-30"
                style="background: radial-gradient(circle, #c7d2fe 0%, transparent 70%);" />

            <!-- Mobile-only logo -->
            <div class="lg:hidden mb-10 relative z-10">
                <router-link :to="{ name: 'home' }" class="block">
                    <Logo class="h-10 mx-auto" />
                </router-link>
            </div>

            <div class="w-full max-w-[420px] relative z-10">
                <RouterView />
            </div>
        </main>

    </div>
</template>