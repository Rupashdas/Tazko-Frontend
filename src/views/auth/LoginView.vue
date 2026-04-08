<script setup>
import { ref, computed } from 'vue'
import { addIcons } from "oh-vue-icons";
import { MdAlternateemailOutlined, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, BiArrowRepeat, BiSlashCircle } from "oh-vue-icons/icons";
import { validators } from '@/utils/validators'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/utils/toast'

addIcons(MdAlternateemailOutlined, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, BiArrowRepeat, BiSlashCircle);

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { errorToast } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

const errors = ref({})

const validate = () => {
  const e = {}
  const emailErr = validators.email(email.value)
  if (emailErr) e.email = emailErr
  if (!password.value?.trim()) e.password = 'Password is required'
  errors.value = e
  return !Object.keys(e).length
}

const clearError = (field) => {
  if (errors.value[field]) errors.value = { ...errors.value, [field]: null }
}

// Show a contextual banner when redirected after deactivation
const isDeactivated = computed(() => route.query.reason === 'deactivated')

const fillCredentials = (type) => {
    if (type === 'superadmin') {
        email.value = 'admin@example.com'
        password.value = 'Pass123#'
    } else {
        email.value = 'rupash.das.202@gmail.com'
        password.value = 'Pass123#'
    }
}

const handleLogin = async () => {
  if (!validate()) return
  loading.value = true
  const response = await auth.login(email.value, password.value)
  if (response.success) {
    router.push({ name: 'home' })
  } else {
    if (response.errors && Object.keys(response.errors).length > 0) {
      const fieldKeys = ['email', 'password']
      const mapped = {}
      const unhandled = []
      Object.entries(response.errors).forEach(([key, val]) => {
        const msg = Array.isArray(val) ? val[0] : val
        if (fieldKeys.includes(key)) mapped[key] = msg
        else unhandled.push(msg)
      })
      if (Object.keys(mapped).length) errors.value = { ...errors.value, ...mapped }
      unhandled.forEach(msg => errorToast(msg))
    } else {
      errorToast(response.message || 'Something went wrong')
    }
  }
  loading.value = false
}
</script>

<template>
    <div class="animate-fade-in">

        <!-- Header -->
        <div class="mb-8">
            <h2 class="auth-title mb-4">Sign in to Tazko</h2>
            <p class="section-desc">
                Don't have an account?
                <router-link :to="{ name: 'signup' }"
                    class="font-semibold text-accent hover:text-accent/80 transition-colors ml-1">
                    Create one free →
                </router-link>
            </p>
        </div>

        <!-- ── Deactivated account banner ───────────────────────── -->
        <Transition name="slide-down">
            <div v-if="isDeactivated"
                class="mb-6 flex items-start gap-3 px-4 py-3 rounded-sm bg-red-50 border border-red-200">
                <div class="w-8 h-8 rounded-sm bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <v-icon name="bi-slash-circle" class="w-4 h-4 text-red-500" scale="1" />
                </div>
                <div>
                    <p class="text-base font-bold text-red-700 leading-tight">Account deactivated</p>
                    <p class="text-sm text-red-500 mt-0.5 leading-relaxed">
                        Your account has been deactivated. Please contact your administrator to regain access.
                    </p>
                </div>
            </div>
        </Transition>

        <!-- Quick Login Chips -->
        <div class="mb-7">
            <p class="block text-base font-semibold text-text mb-3">Quick fill for demo</p>
            <div class="flex gap-2">
                <button @click="fillCredentials('superadmin')"
                    class="flex-1 text-sm font-semibold py-2 px-3 rounded-sm border-2 border-dashed border-accent/30 text-accent/70 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200">
                    Super Admin
                </button>
                <button @click="fillCredentials('admin')"
                    class="flex-1 text-sm font-semibold py-2 px-3 rounded-sm border-2 border-dashed border-accent/30 text-accent/70 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200">
                    Admin
                </button>
            </div>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-7">
            <div class="flex-1 h-px bg-heading/10" />
            <span class="block text-base font-semibold text-text">or continue with email</span>
            <div class="flex-1 h-px bg-heading/10" />
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
                <label class="block text-base font-semibold text-text">
                    Email address <span class="text-red-400 ml-0.5">*</span>
                </label>
                <div class="group relative flex items-center">
                    <span
                        class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors duration-200 pointer-events-none z-10">
                        <v-icon name="md-alternateemail-outlined" scale="0.85" />
                    </span>
                    <input v-model="email" type="email" placeholder="you@company.com" autocomplete="email"
                        class="input-field has-icon" :class="{ 'border-red-400': errors.email }"
                        @input="clearError('email')" />
                </div>
                <p v-if="errors.email" class="text-red-500 text-base mt-1">{{ errors.email }}</p>
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                    <label class="block text-base font-semibold text-text">
                        Password <span class="text-red-400 ml-0.5">*</span>
                    </label>
                    <router-link :to="{ name: 'forgot-password' }"
                        class="text-sm font-medium text-accent hover:text-accent/70 transition-colors">
                        Forgot password?
                    </router-link>
                </div>
                <div class="group relative flex items-center">
                    <span
                        class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors duration-200 pointer-events-none z-10">
                        <v-icon name="ri-lock-password-line" scale="0.85" />
                    </span>
                    <input v-model="password" :type="showPassword ? 'text' : 'password'"
                        placeholder="Enter your password" autocomplete="current-password"
                        class="input-field has-icon has-eye" :class="{ 'border-red-400': errors.password }"
                        @input="clearError('password')" />
                    <button type="button" @click="showPassword = !showPassword"
                        class="absolute right-3.5 text-text hover:text-accent transition-colors duration-200 z-10">
                        <v-icon :name="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" scale="0.85" />
                    </button>
                </div>
                <p v-if="errors.password" class="text-red-500 text-base mt-1">{{ errors.password }}</p>
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading"
                class="tazko-btn w-full"
                :class="loading ? 'opacity-75 cursor-not-allowed' : ''">
                <span class="relative z-10 flex items-center justify-center gap-2">
                    <v-icon v-if="loading" name="bi-arrow-repeat" class="w-4 h-4 animate-spin" scale="1" />
                    {{ loading ? 'Signing in…' : 'Sign in' }}
                </span>
            </button>

        </form>

    </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>