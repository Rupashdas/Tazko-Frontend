<script setup>
import { RouterLink } from "vue-router";
import Logo from "./icons/Logo.vue";
import { addIcons } from "oh-vue-icons";
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useToast } from "@/utils/toast.js"

import { CoHome, BiChatDots, LaUserCircleSolid, CoSettings, MdLogoutOutlined, LaUserEditSolid, BiPalette, MdMenuRound, MdCloseRound, BiFolder2Open, BiChevronDown, BiClipboardCheck } from "oh-vue-icons/icons";
addIcons(CoHome, BiChatDots, LaUserCircleSolid, CoSettings, MdLogoutOutlined, LaUserEditSolid, BiPalette, MdMenuRound, MdCloseRound, BiFolder2Open, BiChevronDown, BiClipboardCheck);

const { errorToast } = useToast()


const router = useRouter()
const auth = useAuthStore()
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

const dropdownOpen = ref(false)
const mobileMenuOpen = ref(false)
const dropdownRef = ref(null)

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

const route = useRoute()

watch(() => route.fullPath, () => {
    dropdownOpen.value = false
    mobileMenuOpen.value = false
})
</script>

<template>
    <header class="sticky top-0 z-50 bg-panel px-4 py-3  md:py-4 shadow-sm border-b border-heading/6">
        <div class="container mx-auto">
            <div class="flex items-center gap-4">

                <!-- Logo -->
                <div class="shrink-0">
                    <RouterLink to="/" class="inline-block w-24 md:w-28">
                        <Logo />
                    </RouterLink>
                </div>

                <!-- Desktop Nav -->
                <nav class="hidden md:flex flex-1 items-center justify-center">
                    <ul class="flex items-center gap-1">
                        <li>
                            <router-link :to="{ name: 'home' }"
                                class="flex items-center gap-2 px-4 py-2 rounded-sm text-base font-medium transition-all duration-150"
                                :class="route.name === 'home' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="co-home" scale="1" /> Home
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{ name: 'my-stuff' }"
                                class="flex items-center gap-2 px-4 py-2 rounded-sm text-base font-medium transition-all duration-150"
                                :class="route.name === 'my-stuff' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="bi-clipboard-check" scale="1" /> My Stuff
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{ name: 'projects' }"
                                class="flex items-center gap-2 px-4 py-2 rounded-sm text-base font-medium transition-all duration-150"
                                :class="route.name === 'projects' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="bi-folder2-open" scale="1" /> Projects
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{ name: 'pings' }"
                                class="flex items-center gap-2 px-4 py-2 rounded-sm text-base font-medium transition-all duration-150"
                                :class="route.name === 'pings' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="bi-chat-dots" scale="1" /> Pings
                            </router-link>
                        </li>
                    </ul>
                </nav>

                <!-- Right side: hamburger (mobile) + profile (always) -->
                <div class="flex items-center gap-2 ml-auto">

                    <!-- Mobile hamburger -->
                    <button class="md:hidden p-2 rounded-sm text-text hover:bg-heading/8 transition-colors"
                        @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
                        <v-icon :name="mobileMenuOpen ? 'md-close-round' : 'md-menu-round'" scale="1.1" />
                    </button>

                    <!-- Profile Dropdown -->
                    <div class="relative" ref="dropdownRef" v-if="auth.isLoggedIn">

                        <!-- Profile Button -->
                        <button
                            class="flex items-center gap-2.5 cursor-pointer rounded-sm px-3 py-2 hover:bg-heading/6 transition-all duration-150"
                            @click="toggleDropdown">
                            <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar"
                                class="w-9 h-9 object-cover rounded-full border-2 border-accent/30 shrink-0" />
                            <v-icon class="w-9 h-9 text-text" v-else name="la-user-circle-solid" />
                            <div class="hidden sm:block text-left">
                                <p class="text-base font-semibold text-heading leading-tight">{{ auth.user?.name ||
                                    'User'
                                }}</p>
                                <p class="text-base text-text leading-tight">{{ auth.user?.roles?.[0]?.label ||
                                    'Member' }}</p>
                            </div>
                            <v-icon name="bi-chevron-down"
                                class="hidden sm:block w-4 h-4 text-text transition-transform duration-200"
                                :class="dropdownOpen ? 'rotate-180' : ''" scale="1" />
                        </button>

                        <!-- Dropdown Panel -->
                        <Transition name="fade-up">
                            <div v-if="dropdownOpen"
                                class="absolute top-14 -right-1 flex-col flex w-72 bg-panel rounded-sm shadow-xl shadow-heading/10 border border-heading/8 overflow-hidden">

                                <!-- Profile Summary -->
                                <div class="bg-accent/6 px-5 py-4 flex items-center gap-3 border-b border-heading/6">
                                    <div class="shrink-0">
                                        <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar"
                                            class="w-14 h-14 object-cover rounded-full border-2 border-accent/30" />
                                        <v-icon class="w-14 h-14 text-text" v-else name="la-user-circle-solid" />
                                    </div>
                                    <div class="min-w-0">
                                        <h4 class="text-base font-bold text-heading truncate">{{ auth.user?.name ||
                                            'User' }}</h4>
                                        <p class="text-base text-text truncate mt-0.5">{{ auth.user?.roles?.[0]?.label
                                            ||
                                            'Member' }}</p>
                                        <p v-if="auth.user?.email" class="text-sm text-text truncate mt-0.5">{{
                                            auth.user.email }}</p>
                                    </div>
                                </div>

                                <!-- Menu Items -->
                                <div class="px-2 py-2">
                                    <router-link :to="{ name: 'profile' }"
                                        class="dropdown-item group hover:bg-heading/5">
                                        <span
                                            class="w-10 h-10 rounded-sm bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                                            <v-icon class="w-5 h-5 text-accent" name="la-user-edit-solid" />
                                        </span>
                                        <div>
                                            <p class="text-base font-semibold text-heading">Edit Profile</p>
                                            <p class="text-base text-text">Update your personal info</p>
                                        </div>
                                    </router-link>

                                    <router-link :to="{ name: 'preferences' }"
                                        class="dropdown-item group hover:bg-heading/5">
                                        <span
                                            class="w-10 h-10 rounded-sm bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                                            <v-icon class="w-5 h-5 text-accent" name="bi-palette" />
                                        </span>
                                        <div>
                                            <p class="text-base font-semibold text-heading">Preferences</p>
                                            <p class="text-base text-text">Theme & display settings</p>
                                        </div>
                                    </router-link>

                                    <router-link v-if="auth.hasCapability('settings.view')"
                                        :to="{ name: 'system-settings' }"
                                        class="dropdown-item group hover:bg-heading/5">
                                        <span
                                            class="w-10 h-10 rounded-sm bg-accent/8 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                                            <v-icon class="w-5 h-5 text-accent" name="co-settings" />
                                        </span>
                                        <div>
                                            <p class="text-base font-semibold text-heading">System Settings</p>
                                            <p class="text-base text-text">Manage users & roles</p>
                                        </div>
                                    </router-link>
                                </div>

                                <!-- Logout -->
                                <div class="px-2 pb-2 border-t border-heading/6 pt-2 mt-0">
                                    <button
                                        class="w-full flex items-center gap-3 px-3 py-3 rounded-sm text-base font-semibold text-red-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 group"
                                        @click="handleLogout">
                                        <span
                                            class="w-10 h-10 rounded-sm bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                                            <v-icon class="w-5 h-5 text-red-400" name="md-logout-outlined" />
                                        </span>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>

            <!-- Mobile Nav Menu -->
            <Transition name="mobile-nav">
                <nav v-if="mobileMenuOpen" class="md:hidden mt-3 pb-2 border-t border-heading/6 pt-3">
                    <ul class="flex flex-col gap-1">
                        <li>
                            <router-link :to="{ name: 'home' }"
                                class="flex items-center gap-3 px-3 py-3  rounded-sm text-base font-medium transition-all"
                                :class="route.name === 'home' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="si-homeadvisor" scale="1" /> Home
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{ name: 'my-stuff' }"
                                class="flex items-center gap-3 px-3 py-3  rounded-sm text-base font-medium transition-all"
                                :class="route.name === 'my-stuff' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="bi-clipboard-check" scale="1" /> My Stuff
                            </router-link>
                        </li>
                        <li>
                            <router-link :to="{ name: 'pings' }"
                                class="flex items-center gap-3 px-3 py-3  rounded-sm text-base font-medium transition-all"
                                :class="route.name === 'pings' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/6 hover:text-heading'">
                                <v-icon name="bi-chat-dots" scale="1" /> Pings
                            </router-link>
                        </li>
                    </ul>
                </nav>
            </Transition>
        </div>
    </header>
</template>

<style scoped>
@reference "tailwindcss";

.dropdown-item {
    @apply w-full flex items-center gap-3 px-3 py-3 rounded-sm cursor-pointer transition-all duration-150;
}

/* Dropdown fade-up */
.fade-up-enter-active,
.fade-up-leave-active {
    transition: all 0.2s ease-in-out;
}

.fade-up-enter-from,
.fade-up-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

/* Mobile nav slide-down */
.mobile-nav-enter-active,
.mobile-nav-leave-active {
    transition: all 0.2s ease-in-out;
    overflow: hidden;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
    opacity: 0;
    max-height: 0;
}

.mobile-nav-enter-to,
.mobile-nav-leave-from {
    opacity: 1;
    max-height: 200px;
}
</style>