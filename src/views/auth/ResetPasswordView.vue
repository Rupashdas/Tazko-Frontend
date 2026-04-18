<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
    RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
    BiCheckCircle, BiLock, BiCheckCircleFill,
    BiExclamationCircleFill, BiArrowRepeat,
} from 'oh-vue-icons/icons'
import axios from '@/axios'
import { useToast } from '@/utils/toast'
import { validators } from '@/utils/validators'

addIcons(
    RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
    BiCheckCircle, BiLock, BiCheckCircleFill,
    BiExclamationCircleFill, BiArrowRepeat,
)

const { errorToast } = useToast()
const route = useRoute()
const router = useRouter()

const token = ref(route.query.token || '')
const email = ref(route.query.email || '')
const password = ref('')
const password_confirmation = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const success = ref(false)

const errors = ref({})

const validate = () => {
  const e = {}
  const pwErr = validators.required(password.value, 'Password')
  if (pwErr) e.password = pwErr
  const confirmErr = validators.required(password_confirmation.value, 'Confirm password')
  if (confirmErr) e.password_confirmation = confirmErr
  else {
    const matchErr = validators.passwordMatch(password_confirmation.value, password.value)
    if (matchErr) e.password_confirmation = matchErr
  }
  errors.value = e
  return !Object.keys(e).length
}

const clearError = (field) => {
  if (errors.value[field]) errors.value = { ...errors.value, [field]: null }
}

// Password strength
const passwordStrength = computed(() => {
    const val = password.value
    if (!val) return { score: 0, label: '', color: '' }
    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    const levels = [
        { label: 'Too short', color: 'bg-red-400' },
        { label: 'Weak', color: 'bg-orange-400' },
        { label: 'Fair', color: 'bg-yellow-400' },
        { label: 'Good', color: 'bg-blue-400' },
        { label: 'Strong', color: 'bg-emerald-400' },
    ]
    return { score, ...levels[score] }
})

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const { data } = await axios.post('/api/password/reset', {
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    })
    if (data.status === 'success') {
      success.value = true
      setTimeout(() => router.push({ name: 'login' }), 2500)
    }
  } catch (err) {
    if (err.response?.data) {
      const response = err.response.data
      if (response.errors && Object.keys(response.errors).length > 0) {
        const fieldKeys = ['password', 'password_confirmation']
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
    } else {
      errorToast('Network error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
    <div class="animate-fade-in">

        <!-- Success state -->
        <div v-if="success" class="text-center">
            <div
                class="w-16 h-16 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <v-icon name="bi-check-circle" class="text-emerald-500" scale="1.8" />
            </div>
            <h2 class="auth-title mb-3">Password updated!</h2>
            <p class="section-desc mb-6">
                Your password has been changed successfully.<br>Redirecting you to sign in…
            </p>
            <div class="flex justify-center">
                <div class="flex gap-1">
                    <div v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-accent/80 animate-bounce"
                        :style="`animation-delay: ${(i - 1) * 0.15}s`" />
                </div>
            </div>
        </div>

        <!-- Default state -->
        <div v-else>
            <!-- Header -->
            <div class="mb-8">
                <div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center mb-5">
                    <v-icon name="bi-lock" class="text-accent" scale="1.3" />
                </div>

                <h2 class="auth-title">Set new password</h2>
                <p class="mt-2 section-desc">
                    Choose a strong, unique password to protect your account.
                </p>
            </div>

            <form @submit.prevent="submit" class="flex flex-col gap-5">

                <!-- New Password -->
                <div class="flex flex-col gap-1.5">
                    <label class="block text-base font-semibold text-text">
                        New Password <span class="text-red-400">*</span>
                    </label>
                    <div class="group relative flex items-center">
                        <span
                            class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors pointer-events-none z-10">
                            <v-icon name="ri-lock-password-line" scale="0.85" />
                        </span>
                        <input v-model="password" :type="showPassword ? 'text' : 'password'"
                            placeholder="Create a strong password" required autocomplete="new-password"
                            class="input-field has-icon has-eye" :class="{ 'border-red-400 focus:border-red-400': errors.password }"
                            @input="clearError('password')" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute right-3.5 text-text hover:text-accent transition-colors z-10">
                            <v-icon :name="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" scale="0.85" />
                        </button>
                    </div>
                    <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>

                    <!-- Strength bar -->
                    <div v-if="password" class="flex items-center gap-2 mt-0.5">
                        <div class="flex gap-1 flex-1">
                            <div v-for="i in 4" :key="i" class="flex-1 h-1.5 rounded-full transition-all duration-300"
                                :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-heading/10'" />
                        </div>
                        <span class="text-base font-semibold text-text">{{ passwordStrength.label }}</span>
                    </div>

                    <!-- Requirements -->
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
                        <div v-for="(req, i) in [
                            { label: '8+ characters', met: password.length >= 8 },
                            { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                            { label: 'Number', met: /[0-9]/.test(password) },
                            { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
                        ]" :key="i" class="flex items-center gap-1.5">
                            <v-icon name="bi-check-circle-fill" class="flex-shrink-0 transition-colors duration-200"
                                :class="req.met ? 'text-emerald-400' : 'text-heading'" scale="0.75" />
                            <span class="text-sm transition-colors duration-200"
                                :class="req.met ? 'text-heading' : 'text-text'">
                                {{ req.label }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Confirm Password -->
                <div class="flex flex-col gap-1.5">
                    <label class="block text-base font-semibold text-text">
                        Confirm Password <span class="text-red-400">*</span>
                    </label>
                    <div class="group relative flex items-center">
                        <span
                            class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors pointer-events-none z-10">
                            <v-icon name="ri-lock-password-line" scale="0.85" />
                        </span>
                        <input v-model="password_confirmation" :type="showConfirm ? 'text' : 'password'"
                            placeholder="Repeat your new password" required autocomplete="new-password"
                            class="input-field has-icon has-eye"
                            :class="errors.password_confirmation || (password_confirmation && password !== password_confirmation)
                                ? 'border-red-400 focus:border-red-400'
                                : password_confirmation && password === password_confirmation
                                    ? 'border-emerald-400 focus:border-emerald-400'
                                    : ''"
                            @input="clearError('password_confirmation')" />
                        <button type="button" @click="showConfirm = !showConfirm"
                            class="absolute right-3.5 text-text hover:text-accent transition-colors z-10">
                            <v-icon :name="showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'" scale="0.85" />
                        </button>
                    </div>
                    <p v-if="errors.password_confirmation || (password_confirmation && password !== password_confirmation)"
                        class="text-sm text-red-400 font-medium flex items-center gap-1">
                        <v-icon name="bi-exclamation-circle-fill" scale="0.75" />
                        {{ errors.password_confirmation || "Passwords don't match" }}
                    </p>
                </div>

                <!-- Submit -->
                <button type="submit" :disabled="loading"
                    class="tazko-btn w-full mt-1"
                    :class="loading ? 'opacity-70 cursor-not-allowed' : ''">
                    <span v-if="!loading" class="flex items-center justify-center gap-2">
                        Reset Password →
                    </span>
                    <span v-else class="flex items-center justify-center gap-2">
                        <v-icon name="bi-arrow-repeat" class="w-4 h-4 animate-spin" scale="1" />
                        Resetting...
                    </span>
                </button>

            </form>
        </div>

    </div>
</template>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.45s ease both;
}
</style>