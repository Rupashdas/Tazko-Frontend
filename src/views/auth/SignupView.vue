<script setup>
import { ref, computed } from 'vue'
import { addIcons } from "oh-vue-icons";
import { MdAlternateemailOutlined, RiLockPasswordLine, CoUserPlus, RiEyeLine, RiEyeOffLine, BiArrowRight, BiExclamationCircleFill, BiArrowRepeat } from "oh-vue-icons/icons";
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'
import { useToast } from '@/utils/toast'
import { validators } from '@/utils/validators'

addIcons(MdAlternateemailOutlined, RiLockPasswordLine, CoUserPlus, RiEyeLine, RiEyeOffLine, BiArrowRight, BiExclamationCircleFill, BiArrowRepeat);

const router = useRouter()
const { errorToast } = useToast()
const auth = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

const errors = ref({})

const validate = () => {
    const e = {}
    const firstErr = validators.required(firstName.value, 'First name')
    if (firstErr) e.firstName = firstErr
    const lastErr = validators.required(lastName.value, 'Last name')
    if (lastErr) e.lastName = lastErr
    const emailErr = validators.email(email.value)
    if (emailErr) e.email = emailErr
    const pwErr = validators.required(password.value, 'Password')
    if (pwErr) e.password = pwErr
    const confirmErr = validators.required(confirmPassword.value, 'Confirm password')
    if (confirmErr) e.confirmPassword = confirmErr
    else {
        const matchErr = validators.passwordMatch(confirmPassword.value, password.value)
        if (matchErr) e.confirmPassword = matchErr
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

const handleSignup = async () => {
    if (!validate()) return
    loading.value = true
    const name = `${firstName.value} ${lastName.value}`
    const response = await auth.signup(name, email.value, password.value)
    if (response.success) {
        router.push({ name: 'home' })
    } else {
        if (response.errors && Object.keys(response.errors).length > 0) {
            const fieldMap = { name: 'firstName', email: 'email', password: 'password' }
            const mapped = {}
            const unhandled = []
            Object.entries(response.errors).forEach(([key, val]) => {
                const msg = Array.isArray(val) ? val[0] : val
                if (fieldMap[key]) mapped[fieldMap[key]] = msg
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
            <h2 class="auth-title">Create your account</h2>
            <p class="mt-2 text-base text-text leading-relaxed">
                Already have an account?
                <router-link :to="{ name: 'login' }"
                    class="font-semibold text-accent hover:text-accent/80 transition-colors ml-1">
                    Sign in →
                </router-link>
            </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSignup" class="flex flex-col gap-4">

            <!-- Name row -->
            <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                    <label class="block text-base font-semibold text-text">
                        First Name <span class="text-red-400">*</span>
                    </label>
                    <div class="group relative flex items-center">
                        <span
                            class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors pointer-events-none z-10">
                            <v-icon name="co-user-plus" scale="0.82" />
                        </span>
                        <input v-model="firstName" type="text" placeholder="Jane" autocomplete="given-name"
                            class="input-field has-icon" :class="{ 'border-red-400': errors.firstName }"
                            @input="clearError('firstName')" />
                    </div>
                    <p v-if="errors.firstName" class="text-red-500 text-base mt-1">{{ errors.firstName }}</p>
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="block text-base font-semibold text-text">
                        Last Name <span class="text-red-400">*</span>
                    </label>
                    <div class="group relative flex items-center">
                        <span
                            class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors pointer-events-none z-10">
                            <v-icon name="co-user-plus" scale="0.82" />
                        </span>
                        <input v-model="lastName" type="text" placeholder="Doe" autocomplete="family-name"
                            class="input-field has-icon" :class="{ 'border-red-400': errors.lastName }"
                            @input="clearError('lastName')" />
                    </div>
                    <p v-if="errors.lastName" class="text-red-500 text-base mt-1">{{ errors.lastName }}</p>
                </div>
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
                <label class="block text-base font-semibold text-text">
                    Email address <span class="text-red-400">*</span>
                </label>
                <div class="group relative flex items-center">
                    <span
                        class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors pointer-events-none z-10">
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
                <label class="block text-base font-semibold text-text">
                    Password <span class="text-red-400">*</span>
                </label>
                <div class="group relative flex items-center">
                    <span
                        class="absolute left-3.5 text-text group-focus-within:text-accent transition-colors pointer-events-none z-10">
                        <v-icon name="ri-lock-password-line" scale="0.85" />
                    </span>
                    <input v-model="password" :type="showPassword ? 'text' : 'password'"
                        placeholder="Create a strong password" autocomplete="new-password"
                        class="input-field has-icon has-eye" :class="{ 'border-red-400': errors.password }"
                        @input="clearError('password')" />
                    <button type="button" @click="showPassword = !showPassword"
                        class="absolute right-3.5 text-text hover:text-accent transition-colors z-10">
                        <v-icon :name="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" scale="0.85" />
                    </button>
                </div>
                <p v-if="errors.password" class="text-red-500 text-base mt-1">{{ errors.password }}</p>

                <!-- Strength meter -->
                <div v-if="password" class="flex items-center gap-2 mt-0.5">
                    <div class="flex gap-1 flex-1">
                        <div v-for="i in 4" :key="i" class="flex-1 h-1 rounded-full transition-all duration-300"
                            :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-heading/10'" />
                    </div>
                    <span class="text-sm font-semibold text-text">{{ passwordStrength.label }}</span>
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
                    <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'"
                        placeholder="Repeat your password" autocomplete="new-password"
                        class="input-field has-icon has-eye"
                        :class="errors.confirmPassword || (confirmPassword && password !== confirmPassword)
                            ? 'border-red-400 focus:border-red-400'
                            : confirmPassword && password === confirmPassword
                                ? 'border-emerald-400 focus:border-emerald-400'
                                : ''"
                        @input="clearError('confirmPassword')" />
                    <button type="button" @click="showConfirm = !showConfirm"
                        class="absolute right-3.5 text-text hover:text-accent transition-colors z-10">
                        <v-icon :name="showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'" scale="0.85" />
                    </button>
                </div>
                <p v-if="errors.confirmPassword || (confirmPassword && password !== confirmPassword)"
                    class="text-sm text-red-400 font-medium flex items-center gap-1">
                    <v-icon name="bi-exclamation-circle-fill" scale="0.75" />
                    {{ errors.confirmPassword || "Passwords don't match" }}
                </p>
            </div>

            <!-- Terms note -->
            <p class="text-sm text-text leading-relaxed">
                By creating an account you agree to our
                <a href="#" class="text-accent/80 hover:text-accent underline underline-offset-2">Terms of Service</a>
                and
                <a href="#" class="text-accent/80 hover:text-accent underline underline-offset-2">Privacy Policy</a>.
            </p>

            <!-- Submit -->
            <button type="submit" :disabled="loading"
                class="tazko-btn w-full"
                :class="loading ? 'opacity-70 cursor-not-allowed' : ''">
                <span v-if="!loading" class="flex items-center justify-center gap-2">
                    Create Account
                    <v-icon name="bi-arrow-right" scale="1" />
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                    <v-icon name="bi-arrow-repeat" class="w-4 h-4 animate-spin" scale="1" />
                    Creating account...
                </span>
            </button>

        </form>

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