<script setup>
import { ref } from 'vue'
import { addIcons } from "oh-vue-icons";
import {
    MdAlternateemailOutlined,
    BiArrowLeft, BiKey, BiInfoCircleFill,
    BiSend, BiArrowRepeat, BiEnvelopeCheck,
} from "oh-vue-icons/icons";
import axios from '@/axios'
import { useToast } from '@/utils/toast'
import { validators } from '@/utils/validators'

addIcons(
    MdAlternateemailOutlined,
    BiArrowLeft, BiKey, BiInfoCircleFill,
    BiSend, BiArrowRepeat, BiEnvelopeCheck,
);

const { errorToast } = useToast()

const email = ref('')
const loading = ref(false)
const submitted = ref(false)

const errors = ref({})

const validate = () => {
  const e = {}
  const emailErr = validators.email(email.value)
  if (emailErr) e.email = emailErr
  errors.value = e
  return !Object.keys(e).length
}

const clearError = (field) => {
  if (errors.value[field]) errors.value = { ...errors.value, [field]: null }
}

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const { data } = await axios.post('/api/password/email', { email: email.value })
    if (data.status === "success") {
      submitted.value = true
    } else {
      errorToast(data.message)
    }
  } catch (err) {
    if (err.response?.data) {
      const response = err.response.data
      if (response.errors?.email) {
        errors.value = { email: Array.isArray(response.errors.email) ? response.errors.email[0] : response.errors.email }
      } else if (response.errors && Object.keys(response.errors).length > 0) {
        Object.values(response.errors).flat().forEach(msg => errorToast(msg))
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

const resetForm = () => {
    submitted.value = false
    email.value = ''
    errors.value = {}
}
</script>

<template>
    <div class="animate-fade-in">

        <!-- Success State -->
        <div v-if="submitted" class="text-center">
            <!-- ✅ Replaced email envelope SVG with v-icon -->
            <div
                class="w-16 h-16 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <v-icon name="bi-envelope-check" class="w-8 h-8 text-emerald-500" scale="1.6" />
            </div>

            <h2 class="auth-title mb-4">
                Check your inbox
            </h2>
            <p class="section-desc mb-2">
                We've sent a password reset link to
            </p>
            <p class="text-base font-semibold text-heading mb-6 px-4 py-2 bg-heading/5 rounded-sm inline-block">
                {{ email }}
            </p>
            <p class="section-desc mb-8">
                Didn't receive it? Check your spam folder or try again.
            </p>

            <div class="flex flex-col gap-3">
                <button @click="resetForm" class="tazko-btn w-full">
                    Try a different email
                </button>
                <router-link :to="{ name: 'login' }"
                    class="text-base font-medium text-text hover:text-accent transition-colors text-center">
                    <v-icon name="bi-arrow-left" class="w-4 h-4" scale="1" /> Back to sign in
                </router-link>
            </div>
        </div>

        <!-- Default State -->
        <div v-else>
            <!-- Header -->
            <div class="mb-8">
                <router-link :to="{ name: 'login' }"
                    class="inline-block text-base font-medium text-text hover:text-accent transition-colors mb-6">
                    <v-icon name="bi-arrow-left" class="w-4 h-4" scale="1" />
                    Back to sign in
                </router-link>

                <div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center mb-5">
                    <v-icon name="bi-key" class="w-6 h-6 text-accent" scale="1.3" />
                </div>

                <h2 class="auth-title">Reset password</h2>
                <p class="mt-2 section-desc">
                    Enter your email and we'll send you a secure link to reset your password.
                </p>
            </div>

            <!-- Form -->
            <form @submit.prevent="submit" class="flex flex-col gap-5">

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
                    <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
                </div>

                <div class="flex items-start gap-2.5 p-3.5 rounded-sm bg-accent/5 border border-accent/15">
                    <v-icon name="bi-info-circle-fill" class="text-accent mt-0.5 flex-shrink-0" scale="1" />
                    <p class="text-sm text-text leading-relaxed">
                        The reset link expires in <strong class="text-heading">60 minutes</strong> for security.
                    </p>
                </div>

                <button type="submit" :disabled="loading"
                    class="tazko-btn w-full"
                    :class="loading ? 'opacity-70 cursor-not-allowed' : ''">
                    <span v-if="!loading" class="flex items-center justify-center gap-2">
                        Send Reset Link
                        <v-icon name="bi-send" scale="1" />
                    </span>
                    <span v-else class="flex items-center justify-center gap-2">
                        <v-icon name="bi-arrow-repeat" class="animate-spin" scale="1" />
                        Sending link...
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