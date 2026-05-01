<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
	BiPersonPlus, BiCheckCircleFill, BiExclamationCircleFill,
	BiArrowRepeat, BiBoxArrowInRight,
} from 'oh-vue-icons/icons'
import axios from '@/axios'
import { useToast } from '@/utils/toast'
import { validators } from '@/utils/validators'

addIcons(
	RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
	BiPersonPlus, BiCheckCircleFill, BiExclamationCircleFill,
	BiArrowRepeat, BiBoxArrowInRight,
)

const { errorToast } = useToast()
const route = useRoute()
const router = useRouter()

const token = route.query.token ?? ''
const loading = ref(false)
const checking = ref(true)
const invalid = ref(false)
const done = ref(false)

const invitation = ref(null)  // { name, email, role, invited_by, expires_at }

const password = ref('')
const password_confirmation = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

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

/* ── Password strength ── */
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

/* ── Validate token on mount ── */
onMounted(async () => {
	if (!token) { invalid.value = true; checking.value = false; return }

	try {
		const { data } = await axios.get(`/api/invitations/${token}`)
		invitation.value = data.data
	} catch {
		invalid.value = true
	} finally {
		checking.value = false
	}
})

/* ── Accept ── */
const submit = async () => {
	if (!validate()) return
	loading.value = true
	try {
		const { data } = await axios.post(`/api/invitations/${token}/accept`, {
			password: password.value,
			password_confirmation: password_confirmation.value,
		})
		if (data.status === 'success') {
			done.value = true
		}
	} catch (err) {
		const apiErrors = err.response?.data?.errors
		if (apiErrors) {
			const fieldKeys = ['password', 'password_confirmation']
			const mapped = {}
			const unhandled = []
			Object.entries(apiErrors).forEach(([key, val]) => {
				const msg = Array.isArray(val) ? val[0] : val
				if (fieldKeys.includes(key)) mapped[key] = msg
				else unhandled.push(msg)
			})
			if (Object.keys(mapped).length) errors.value = { ...errors.value, ...mapped }
			unhandled.forEach(m => errorToast(m))
		} else {
			errorToast(err.response?.data?.message ?? 'Something went wrong.')
		}
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="animate-fade-in">

		<!-- Checking state -->
		<div v-if="checking" class="flex flex-col items-center justify-center py-16 gap-4">
			<div class="w-10 h-10 rounded-full border-3 border-accent border-t-transparent animate-spin" />
			<p class="text-base text-text">Verifying invitation…</p>
		</div>

		<!-- Invalid token -->
		<div v-else-if="invalid" class="text-center py-8">
			<div
				class="w-16 h-16 rounded-sm bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
				<v-icon name="bi-exclamation-circle-fill" class="text-red-400" scale="1.8" />
			</div>
			<h2 class="auth-title mb-3">Invalid Invitation</h2>
			<p class="text-base text-text mb-6 leading-relaxed">
				This invitation link is invalid or has expired.<br>Please ask your administrator to send a new one.
			</p>
			<router-link :to="{ name: 'login' }"
				class="text-base font-medium text-accent hover:text-accent/80 transition-colors">
				← Back to sign in
			</router-link>
		</div>

		<!-- Done state -->
		<div v-else-if="done" class="text-center py-8">
			<div
				class="w-16 h-16 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
				<v-icon name="bi-check-circle-fill" class="text-emerald-500" scale="1.8" />
			</div>
			<h2 class="auth-title mb-3">Account Created! 🎉</h2>
			<p class="text-base text-text leading-relaxed mb-8">
				Your account has been created successfully.<br>
				You can now sign in with your email and password.
			</p>
			<router-link :to="{ name: 'login' }"
				class="tazko-btn inline-block px-6 py-3 rounded-sm text-base font-bold">
				<v-icon name="bi-box-arrow-in-right" scale="1" />
				Go to Login →
			</router-link>
		</div>

		<!-- Accept form -->
		<div v-else>
			<!-- Header -->
			<div class="mb-8">
				<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center mb-5">
					<v-icon name="bi-person-plus" class="text-accent" scale="1.2" />
				</div>
				<h2 class="auth-title">Accept Invitation</h2>
				<p class="section-desc">
					You've been invited by <strong class="text-heading">{{ invitation.invited_by }}</strong>.
					Set a password to create your account.
				</p>
			</div>

			<!-- Invite info card -->
			<div class="flex items-center gap-3 p-3.5 bg-heading/5 rounded-sm border border-heading/10 mb-6">
				<div
					class="w-12 h-12 rounded-sm bg-accent/15 flex items-center justify-center shrink-0 text-base font-bold text-accent">
					{{ invitation.name?.charAt(0)?.toUpperCase() }}
				</div>
				<div class="min-w-0">
					<p class="text-base font-semibold text-heading leading-tight truncate">{{ invitation.name }}</p>
					<p class="text-sm text-text mt-0.5 truncate">{{ invitation.email }}</p>
				</div>
				<span v-if="invitation.role"
					class="ml-auto text-sm font-semibold px-2.5 py-1 rounded-sm bg-accent/10 text-accent shrink-0">
					{{ invitation.role }}
				</span>
			</div>

			<!-- Form -->
			<form @submit.prevent="submit" class="flex flex-col gap-5">

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
							placeholder="Create a strong password" required autocomplete="new-password"
							class="input-field has-icon has-eye"
							:class="{ 'border-red-400 focus:border-red-400': errors.password }"
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
						<span class="text-sm font-semibold text-text">{{ passwordStrength.label }}</span>
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
							placeholder="Repeat your password" required autocomplete="new-password"
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

				<button type="submit" :disabled="loading || passwordStrength.score < 2"
					class="tazko-btn w-full disabled:opacity-70 disabled:cursor-not-allowed">
					<span v-if="loading" class="flex items-center justify-center gap-2">
						<v-icon name="bi-arrow-repeat" class="animate-spin" scale="1" />
						Creating account…
					</span>
					<span v-else class="flex items-center justify-center gap-2">
						<v-icon name="bi-person-plus" scale="1" />
						Create My Account →
					</span>
				</button>
			</form>

			<p class="text-center text-base text-text mt-6">
				Already have an account?
				<router-link :to="{ name: 'login' }"
					class="text-accent hover:text-accent/80 font-semibold transition-colors">
					Sign in
				</router-link>
			</p>
		</div>

	</div>
</template>