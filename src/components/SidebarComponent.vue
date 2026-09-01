<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'
import { useToast } from '@/utils/toast.js'
import { addIcons } from 'oh-vue-icons'
import {
    BiHouse, BiClipboardCheck, BiFolder2Open, BiChatDots, BiStopwatch,
    BiGear, BiX, BiChevronLeft, BiChevronRight, BiPerson, BiPalette, BiBoxArrowRight
} from "oh-vue-icons/icons"

addIcons(BiHouse, BiClipboardCheck, BiFolder2Open, BiChatDots, BiStopwatch,
    BiGear, BiX, BiChevronLeft, BiChevronRight, BiPerson, BiPalette, BiBoxArrowRight)

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { errorToast } = useToast()

const props = defineProps({
    mobileOpen: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close'])

const collapsed = ref(false)

const handleLogout = async () => {
    const response = await auth.logout()
    if (response.success) {
        await router.push({ name: 'login' })
    } else {
        if (response.errors && Object.keys(response.errors).length > 0) {
            Object.values(response.errors).flat().forEach(message => {
                errorToast(message)
            })
        } else if (response.message) {
            errorToast(response.message)
        } else {
            errorToast('Something went wrong')
        }
    }
}

const isActive = (name) => {
    return route.name === name
}

const navItems = computed(() => {
    const items = [
        { name: 'home', label: 'Home', icon: 'bi-house' },
        { name: 'my-stuff', label: 'My Stuff', icon: 'bi-clipboard-check' },
        { name: 'projects', label: 'Projects', icon: 'bi-folder2-open' },
        { name: 'pings', label: 'Pings', icon: 'bi-chat-dots' },
        { name: 'time-tracking', label: 'Time', icon: 'bi-stopwatch' },
    ]
    if (auth.hasCapability('settings.view')) {
        items.push({ name: 'system-settings', label: 'Settings', icon: 'bi-gear' })
    }
    return items
})

const closeMobile = () => {
    emit('close')
}

onMounted(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1024) {
            emit('close')
        }
    }
    window.addEventListener('resize', handleResize)
    onBeforeUnmount(() => window.removeEventListener('resize', handleResize))
})
</script>

<template>
    <aside
        class="sidebar flex flex-col"
        :class="{ 'sidebar-collapsed': collapsed, 'translate-x-0': props.mobileOpen, '-translate-x-full lg:translate-x-0': !props.mobileOpen }"
    >
        <!-- Logo Area -->
        <div class="flex items-center justify-between h-16 px-4 border-b border-heading/6">
            <RouterLink to="/" class="flex items-center gap-3 shrink-0">
                <div :class="collapsed ? 'w-8 h-8' : 'w-9 h-9'" class="flex items-center justify-center rounded-lg bg-accent text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <span v-show="!collapsed" class="text-lg font-bold text-heading tracking-tight">Tazko</span>
            </RouterLink>
            <button
                v-if="!props.mobileOpen"
                @click="collapsed = !collapsed"
                class="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-text hover:bg-heading/5 transition-colors"
                :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            >
                <v-icon :name="collapsed ? 'bi-chevron-right' : 'bi-chevron-left'" scale="0.9" />
            </button>
            <button
                v-if="props.mobileOpen"
                @click="emit('close')"
                class="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-text hover:bg-heading/5"
            >
                <v-icon name="bi-x" scale="1.1" />
            </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <RouterLink
                v-for="item in navItems"
                :key="item.name"
                :to="{ name: item.name }"
                @click="emit('close')"
                class="sidebar-nav-item"
                :class="isActive(item.name) ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'"
            >
                <v-icon :name="item.icon" scale="1.15" class="shrink-0" />
                <span v-show="!collapsed" class="truncate">{{ item.label }}</span>
                <span
                    v-if="isActive(item.name)"
                    class="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                    :class="{ 'hidden': collapsed }"
                />
            </RouterLink>
        </nav>

        <!-- User Section -->
        <div class="p-3 border-t border-heading/6">
            <div class="flex items-center gap-3 px-2 py-2">
                <img
                    v-if="auth.user?.avatar"
                    :src="auth.user.avatar"
                    alt="Avatar"
                    class="w-9 h-9 rounded-full object-cover border border-heading/10 shrink-0"
                />
                <div v-else class="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                    {{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}
                </div>
                <div v-show="!collapsed" class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-heading truncate">{{ auth.user?.name || 'User' }}</p>
                    <p class="text-xs text-text truncate">{{ auth.user?.roles?.[0]?.label || 'Member' }}</p>
                </div>
            </div>
            <div v-show="!collapsed" class="mt-2 space-y-0.5">
                <RouterLink
                    to="/profile"
                    @click="emit('close')"
                    class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-text hover:bg-heading/5 hover:text-heading transition-colors"
                >
                    <v-icon name="bi-person" scale="0.9" />
                    Profile
                </RouterLink>
                <RouterLink
                    to="/preferences"
                    @click="emit('close')"
                    class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-text hover:bg-heading/5 hover:text-heading transition-colors"
                >
                    <v-icon name="bi-palette" scale="0.9" />
                    Preferences
                </RouterLink>
                <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-red-600 hover:bg-red-500/5 transition-colors"
                >
                    <v-icon name="bi-box-arrow-right" scale="0.9" />
                    Sign out
                </button>
            </div>
        </div>
    </aside>
</template>

<style scoped>
@reference "tailwindcss";

.sidebar {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
}

.sidebar:hover {
    scrollbar-color: var(--color-heading) transparent;
}

.sidebar::-webkit-scrollbar {
    width: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 4px;
}

.sidebar:hover::-webkit-scrollbar-thumb {
    background: var(--color-heading);
}

/* Router link active state */
a.router-link-active.sidebar-nav-item-active {
    background: var(--color-accent);
    color: white;
}
a.router-link-active.sidebar-nav-item-active span,
a.router-link-active.sidebar-nav-item-active svg {
    color: white;
}
</style>
