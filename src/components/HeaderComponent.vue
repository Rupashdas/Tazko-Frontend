<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/utils/toast.js'
import { addIcons } from 'oh-vue-icons'
import { MdMenuRound, MdCloseRound, MdSearch, MdNotificationsnone,
MdLogoutOutlined, LaUserCircleSolid, LaUserEditSolid,
BiChevronDown, BiPalette, BiGear } from "oh-vue-icons/icons"

addIcons(MdMenuRound, MdCloseRound, MdSearch, MdNotificationsnone,
MdLogoutOutlined, LaUserCircleSolid, LaUserEditSolid,
BiChevronDown, BiPalette, BiGear)

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { errorToast } = useToast()

const dropdownOpen = ref(false)
const dropdownRef = ref(null)

const props = defineProps({
    sidebarOpen: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggle-sidebar'])

const handleLogout = async () => {
    dropdownOpen.value = false
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

const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value
}

const handleClickOutside = (e) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
        dropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})

watch(() => route.fullPath, () => {
    dropdownOpen.value = false
})
</script>

<template>
    <header class="app-header h-16">
        <div class="flex items-center justify-between h-full px-4 lg:px-6">
            <!-- Left: Sidebar toggle + breadcrumb-ish area -->
            <div class="flex items-center gap-4">
                <button
                    class="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-text hover:bg-heading/5 transition-colors"
                    @click="emit('toggle-sidebar')"
                    aria-label="Toggle sidebar"
                >
                    <v-icon :name="props.sidebarOpen ? 'md-close-round' : 'md-menu-round'" scale="1.1" />
                </button>
                <button
                    class="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-text hover:bg-heading/5 transition-colors"
                    @click="emit('toggle-sidebar')"
                    aria-label="Toggle menu"
                >
                    <v-icon :name="props.sidebarOpen ? 'md-close-round' : 'md-menu-round'" scale="1.1" />
                </button>

                <!-- Page title area (can be enhanced later with breadcrumbs) -->
                <div class="hidden sm:block">
                    <h1 class="text-base font-semibold text-heading tracking-tight">{{ route.meta.title || 'Tazko' }}</h1>
                </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
                <!-- Search (expandable) -->
                <div class="hidden md:flex items-center">
                    <button class="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text hover:bg-heading/5 transition-colors">
                        <v-icon name="md-search" scale="0.9" />
                        <span class="text-text/60">Search...</span>
                        <kbd class="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-text/50 bg-heading/5 border border-heading/8">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                <!-- Notifications -->
                <button class="relative flex items-center justify-center w-9 h-9 rounded-md text-text hover:bg-heading/5 transition-colors">
                    <v-icon name="md-notificationsnone" scale="1.1" />
                    <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-panel"></span>
                </button>

                <!-- Profile Dropdown -->
                <div class="relative" ref="dropdownRef" v-if="auth.isLoggedIn">
                    <button
                        class="flex items-center gap-2.5 cursor-pointer rounded-md px-2 py-1.5 hover:bg-heading/5 transition-all duration-150"
                        @click="toggleDropdown"
                    >
                        <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar"
                            class="w-8 h-8 object-cover rounded-full border border-heading/10 shrink-0" />
                        <v-icon v-else class="w-8 h-8 text-text shrink-0" name="la-user-circle-solid" scale="1.1" />
                        <span class="hidden sm:block text-sm font-medium text-heading">{{ auth.user?.name || 'User' }}</span>
                        <v-icon name="bi-chevron-down"
                            class="hidden sm:block w-3.5 h-3.5 text-text/60 transition-transform duration-200"
                            :class="dropdownOpen ? 'rotate-180' : ''" scale="1" />
                    </button>

                    <Transition name="fade-up">
                        <div v-if="dropdownOpen"
                            class="absolute top-12 -right-2 flex-col flex w-64 bg-panel rounded-xl shadow-xl shadow-heading/10 border border-heading/8 overflow-hidden">

                            <div class="px-4 py-3.5 flex items-center gap-3 border-b border-heading/6">
                                <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar"
                                    class="w-10 h-10 object-cover rounded-full border border-heading/10" />
                                <v-icon v-else class="w-10 h-10 text-text" name="la-user-circle-solid" scale="1.2" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-heading truncate">{{ auth.user?.name || 'User' }}</p>
                                    <p class="text-xs text-text truncate">{{ auth.user?.email || '' }}</p>
                                </div>
                            </div>

                            <div class="px-2 py-2">
                                <RouterLink :to="{ name: 'profile' }"
                                    class="dropdown-item dropdown-item-hover group">
                                    <span
                                        class="w-8 h-8 rounded-md bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                                        <v-icon class="w-4 h-4 text-accent" name="la-user-edit-solid" />
                                    </span>
                                    <div>
                                        <p class="text-sm font-medium text-heading">Edit Profile</p>
                                        <p class="text-xs text-text">Update your info</p>
                                    </div>
                                </RouterLink>

                                <RouterLink :to="{ name: 'preferences' }"
                                    class="dropdown-item dropdown-item-hover group">
                                    <span
                                        class="w-8 h-8 rounded-md bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                                        <v-icon class="w-4 h-4 text-accent" name="bi-palette" />
                                    </span>
                                    <div>
                                        <p class="text-sm font-medium text-heading">Preferences</p>
                                        <p class="text-xs text-text">Theme & display</p>
                                    </div>
                                </RouterLink>

                                <RouterLink v-if="auth.hasCapability('settings.view')"
                                    :to="{ name: 'system-settings' }"
                                    class="dropdown-item dropdown-item-hover group">
                                    <span
                                        class="w-8 h-8 rounded-md bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                                        <v-icon class="w-4 h-4 text-accent" name="bi-gear" />
                                    </span>
                                    <div>
                                        <p class="text-sm font-medium text-heading">System Settings</p>
                                        <p class="text-xs text-text">Manage users & roles</p>
                                    </div>
                                </RouterLink>
                            </div>

                            <div class="px-2 pb-2 border-t border-heading/6 pt-2">
                                <button
                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-500/5 transition-all duration-150"
                                    @click="handleLogout">
                                    <v-icon name="md-logout-outlined" scale="0.9" class="text-red-500" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
@reference "tailwindcss";

.dropdown-item {
    @apply w-full flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150;
}

.fade-up-enter-active,
.fade-up-leave-active {
    transition: all 0.2s ease-in-out;
}

.fade-up-enter-from,
.fade-up-leave-to {
    opacity: 0;
    transform: translateY(6px);
}
</style>
