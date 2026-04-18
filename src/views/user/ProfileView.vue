<script setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'
import { useToast } from '@/utils/toast'
import { validators } from '@/utils/validators'
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import axios from '@/axios'
import Croppie from 'croppie'
import 'croppie/croppie.css'
import { addIcons } from 'oh-vue-icons'
import {
	BiPerson, BiTelephone, BiGeoAlt, BiEnvelope,
	BiCamera, BiLock, BiEye, BiEyeSlash,
	BiX, BiListUl, BiArrowRepeat, BiCheck2
} from 'oh-vue-icons/icons'

addIcons(
	BiPerson, BiTelephone, BiGeoAlt, BiEnvelope,
	BiCamera, BiLock, BiEye, BiEyeSlash,
	BiX, BiListUl, BiArrowRepeat, BiCheck2
)

const auth = useAuthStore()
const router = useRouter()
const { successToast, errorToast } = useToast()

// ── Profile fields ────────────────────────────────────
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const title = ref('')
const phone = ref('')
const bio = ref('')
const location = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const avatarFile = ref(null)
const avatarPreview = ref(null)
const loading = ref(false)
const loadingAvatar = ref(false)

const errors = ref({})

const validate = () => {
	const e = {}
	const firstErr = validators.required(firstName.value, 'First name')
	if (firstErr) e.firstName = firstErr
	const lastErr = validators.required(lastName.value, 'Last name')
	if (lastErr) e.lastName = lastErr
	const emailErr = validators.email(email.value)
	if (emailErr) e.email = emailErr
	if (password.value) {
		const matchErr = validators.passwordMatch(confirmPassword.value, password.value)
		if (matchErr) e.confirmPassword = matchErr
	}
	errors.value = e
	return !Object.keys(e).length
}

const clearError = (field) => {
	if (errors.value[field]) errors.value = { ...errors.value, [field]: null }
}

// ── Avatar modal state ────────────────────────────────
const showAvatarModal = ref(false)
const hasImage = ref(false)
const dragActive = ref(false)
const originalFile = ref(null)
const croppieInstance = ref(null)
const croppieEl = ref(null)
const imageInput = ref(null)
const avatarModalContainer = ref(null)

// ── Permissions ───────────────────────────────────────
const canUpdateProfile = computed(() => auth.hasCapability('users.profile.update'))
const canChangePassword = computed(() => auth.hasCapability('users.password.change'))

// ── Derived ───────────────────────────────────────────
const user = computed(() => auth.user)
const displayName = computed(() => [firstName.value, lastName.value].filter(Boolean).join(' ') || 'Your Name')
const userInitials = computed(() => {
	const f = firstName.value?.charAt(0) || ''
	const l = lastName.value?.charAt(0) || ''
	return (f + l).toUpperCase() || '?'
})
const hasAvatar = computed(() => avatarPreview.value || user.value?.avatar)

onBeforeUnmount(() => {
	if (croppieInstance.value) {
		croppieInstance.value.destroy()
		croppieInstance.value = null
	}
})

onMounted(async () => {
	if (!auth.isLoggedIn) {
		await router.push('/login')
		return
	}
	if (auth.user) {
		const nameParts = auth.user.name?.split(' ') || []
		firstName.value = nameParts[0] || ''
		lastName.value = nameParts.slice(1).join(' ') || ''
		email.value = auth.user.email || ''
		title.value = auth.user.title || ''
		phone.value = auth.user.phone || ''
		bio.value = auth.user.bio || ''
		location.value = auth.user.location || ''
	}
})

// ── Profile save ──────────────────────────────────────
const handleProfileSave = async () => {
	if (!canUpdateProfile.value) { errorToast('You do not have permission to update your profile.'); return }
	if (!validate()) return
	if (password.value && !canChangePassword.value) { errorToast('You do not have permission to change your password.'); return }

	loading.value = true
	try {
		const formData = new FormData()
		formData.append('name', `${firstName.value} ${lastName.value}`)
		formData.append('email', email.value)
		formData.append('title', title.value || '')
		formData.append('phone', phone.value || '')
		formData.append('bio', bio.value || '')
		formData.append('location', location.value || '')
		if (password.value) formData.append('password', password.value)

		const { data } = await axios.post('/api/user', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		if (data.status === 'success') {
			auth.user = data.user
			successToast(data.message || 'Profile updated successfully!')
			password.value = ''
			confirmPassword.value = ''
		}
	} catch (err) {
		if (err.response?.data?.errors) {
			const fieldMap = { name: 'firstName', email: 'email', password: 'confirmPassword' }
			const mapped = {}
			const unhandled = []
			Object.entries(err.response.data.errors).forEach(([key, val]) => {
				const msg = Array.isArray(val) ? val[0] : val
				if (fieldMap[key]) mapped[fieldMap[key]] = msg
				else unhandled.push(msg)
			})
			if (Object.keys(mapped).length) errors.value = { ...errors.value, ...mapped }
			unhandled.forEach(msg => errorToast(msg))
		} else {
			errorToast(err.response?.data?.message || 'Something went wrong.')
		}
	} finally {
		loading.value = false
	}
}

// ── Avatar remove ─────────────────────────────────────
const removeAvatar = async () => {
	try {
		const { data } = await axios.post('/api/remove-avatar')
		if (data.status === 'success') {
			auth.user = data.user
			avatarPreview.value = null
			avatarFile.value = null
			successToast(data.message || 'Avatar removed!')
		}
	} catch (err) {
		errorToast(err.response?.data?.message || 'Failed to remove avatar.')
	}
}

// ── Avatar modal ──────────────────────────────────────
const openAvatarModal = () => {
	showAvatarModal.value = true
}

const closeAvatarModal = () => {
	if (croppieInstance.value) {
		croppieInstance.value.destroy()
		croppieInstance.value = null
	}
	hasImage.value = false
	dragActive.value = false
	showAvatarModal.value = false
}

watch(showAvatarModal, (val) => {
	document.body.style.overflow = val ? 'hidden' : ''
})

const handleAvatarClickOutside = (e) => {
	if (avatarModalContainer.value && e.target === avatarModalContainer.value) {
		closeAvatarModal()
	}
}

const handleFile = async (file) => {
	originalFile.value = file
	const reader = new FileReader()
	reader.onload = async (event) => {
		hasImage.value = true
		await nextTick()
		if (croppieInstance.value) croppieInstance.value.destroy()
		croppieInstance.value = new Croppie(croppieEl.value, {
			url: event.target.result,
			viewport: { width: 240, height: 240, type: 'circle' },
			boundary: { width: '100%', height: 288 },
		})
	}
	reader.readAsDataURL(file)
}

const onFileChange = (e) => handleFile(e.target.files[0])

const onDrop = (e) => {
	e.preventDefault()
	dragActive.value = false
	const files = e.dataTransfer.files
	if (files.length === 0) return
	if (files.length > 1) { errorToast("Please upload only one avatar"); return }
	handleFile(files[0])
}

const triggerFileInput = () => {
	if (!hasImage.value) imageInput.value.click()
}

const submitAvatar = async () => {
	if (!croppieInstance.value) return errorToast("No image selected")
	try {
		const blob = await croppieInstance.value.result({
			type: 'blob',
			size: { width: 400, height: 400 },
			format: 'png',
		})
		const fileName = originalFile.value?.name || 'avatar.png'
		const croppedFile = new File([blob], fileName, { type: blob.type })

		const formData = new FormData()
		formData.append('avatar', croppedFile)
		loadingAvatar.value = true
		const { data } = await axios.post('/api/upload-avatar', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})
		if (data.status === 'success') {
			auth.user = data.user
			avatarPreview.value = URL.createObjectURL(croppedFile)
			avatarFile.value = null
			successToast(data.message || 'Avatar updated!')
			closeAvatarModal()
		} else {
			errorToast(data.message || 'Upload failed')
		}
	} catch (err) {
		console.error(err)
		errorToast(err.response?.data?.message || 'Cropping failed')
	} finally {
		loadingAvatar.value = false
	}
}
</script>

<template>
	<div class="max-w-6xl mx-auto py-8">

		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="page-title">My Profile</h1>
			<p class="page-subtitle">Manage your personal information and account security.</p>
		</div>

		<form @submit.prevent="handleProfileSave">
			<div class="flex flex-col lg:flex-row gap-5 lg:gap-6">

				<!-- ── LEFT COLUMN: Avatar Card ─────────────────── -->
				<div class="lg:w-80 shrink-0 space-y-4">

					<!-- Avatar Card -->
					<div class="bg-panel border border-heading/8 rounded-sm p-6 shadow-sm text-center">

						<!-- Avatar display -->
						<div class="relative w-40 h-40 mx-auto mb-4 group">
							<div
								class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-accent/20 ring-offset-2 ring-offset-panel">
								<img v-if="avatarPreview" :src="avatarPreview" alt="Avatar Preview"
									class="w-full h-full object-cover" />
								<img v-else-if="user?.avatar" :src="user.avatar" alt="Avatar"
									class="w-full h-full object-cover" />
								<div v-else
									class="w-full h-full flex items-center justify-center text-4xl font-bold text-white bg-accent">
									{{ userInitials }}
								</div>
							</div>
							<button v-if="hasAvatar && canUpdateProfile" type="button" @click="removeAvatar"
								class="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
								<v-icon name="bi-x" scale="0.9" class="text-white w-8" />
								<span class="text-white text-sm font-semibold">Remove</span>
							</button>
						</div>

						<!-- Name preview -->
						<h3 class="font-bold text-heading text-xl leading-tight">{{ displayName }}</h3>
						<p class="text-base text-text mt-1">{{ title || 'No title set' }}</p>

						<!-- Change avatar button -->
						<button v-if="canUpdateProfile" type="button" @click="openAvatarModal"
							class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-sm border-2 border-dashed border-accent/30 text-accent text-sm font-bold hover:bg-accent/5 hover:border-accent/60 transition-all duration-200 cursor-pointer">
							<v-icon name="bi-camera" scale="1.2" />
							Change Avatar
						</button>
						<div v-else
							class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-heading/8 text-text text-base">
							<v-icon name="bi-lock" scale="0.9" />
							Profile editing restricted
						</div>
					</div>

					<!-- Quick Info Card -->
					<div class="bg-panel border border-heading/8 rounded-sm p-5 shadow-sm space-y-3">
						<p class="text-base font-semibold text-text mb-1.5">Quick Info</p>
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-sm bg-blue-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-envelope" class="text-blue-500" scale="1.2" />
							</div>
							<div class="min-w-0">
								<p class="text-base text-text leading-none">Email</p>
								<p class="text-base font-semibold text-heading truncate mt-0.5">{{ email || '—' }}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-sm bg-green-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-telephone" class="text-green-500" scale="1.2" />
							</div>
							<div class="min-w-0">
								<p class="text-base text-text leading-none">Phone</p>
								<p class="text-base font-semibold text-heading truncate mt-0.5">{{ phone || '—' }}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-sm bg-purple-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-geo-alt" class="text-purple-500" scale="1.2" />
							</div>
							<div class="min-w-0">
								<p class="text-base text-text leading-none">Location</p>
								<p class="text-base font-semibold text-heading truncate mt-0.5">{{ location || '—' }}
								</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div
								class="w-12 h-12 rounded-sm bg-amber-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-person" class="text-amber-500" scale="1.2" />
							</div>
							<div class="min-w-0">
								<p class="text-base text-text leading-none">Role</p>
								<p class="text-base font-semibold text-heading truncate mt-0.5">
									{{ auth.user?.roles?.[0]?.label || '—' }}
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- ── RIGHT COLUMN: Form ───────────────────────── -->
				<div class="flex-1 space-y-5">

					<!-- Section: Basic Information -->
					<div class="bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">
						<div class="px-5 md:px-6 py-5 border-b border-heading/6 flex items-center gap-3">
							<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-person" class="text-accent" scale="1.4" />
							</div>
							<div>
								<h6 class="section-title">Basic Information</h6>
								<p class="section-desc">Your public profile details</p>
							</div>
						</div>
						<div class="p-5 md:p-6 space-y-4">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="flex flex-col gap-1.5">
									<label class="block text-base font-semibold text-text">
										First Name <span class="text-red-400">*</span>
									</label>
									<input v-model="firstName" type="text" placeholder="John" class="input-field"
										:class="{ 'border-red-400': errors.firstName }"
										:disabled="!canUpdateProfile" @input="clearError('firstName')" />
									<p v-if="errors.firstName" class="text-red-500 text-sm mt-1">{{ errors.firstName }}</p>
								</div>
								<div class="flex flex-col gap-1.5">
									<label class="block text-base font-semibold text-text">
										Last Name <span class="text-red-400">*</span>
									</label>
									<input v-model="lastName" type="text" placeholder="Doe" class="input-field"
										:class="{ 'border-red-400': errors.lastName }"
										:disabled="!canUpdateProfile" @input="clearError('lastName')" />
									<p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
								</div>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">
									Email Address <span class="text-red-400">*</span>
								</label>
								<div class="relative">
									<span class="absolute left-3 top-1/2 -translate-y-1/2 text-text">
										<v-icon name="bi-envelope" scale="0.9" />
									</span>
									<input v-model="email" type="email" placeholder="you@company.com"
										class="input-field pl-10" :disabled="!canUpdateProfile"
										:class="{ 'border-red-400': errors.email }" @input="clearError('email')" />
								</div>
								<p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Job Title</label>
								<input v-model="title" type="text" placeholder="e.g. Senior Developer"
									class="input-field" :disabled="!canUpdateProfile" />
							</div>
						</div>
					</div>

					<!-- Section: Contact Details -->
					<div class="bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">
						<div class="px-5 md:px-6 py-5 border-b border-heading/6 flex items-center gap-3">
							<div class="w-12 h-12 rounded-sm bg-blue-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-telephone" class="text-blue-500" scale="1.4" />
							</div>
							<div>
								<h6 class="section-title">Contact Details</h6>
								<p class="section-desc">Phone & location</p>
							</div>
						</div>
						<div class="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Phone</label>
								<div class="relative">
									<span class="absolute left-3 top-1/2 -translate-y-1/2 text-text">
										<v-icon name="bi-telephone" scale="0.9" />
									</span>
									<input v-model="phone" type="text" placeholder="+1 (555) 000-0000"
										class="input-field pl-10" :disabled="!canUpdateProfile" />
								</div>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Location</label>
								<div class="relative">
									<span class="absolute left-3 top-1/2 -translate-y-1/2 text-text">
										<v-icon name="bi-geo-alt" scale="0.9" />
									</span>
									<input v-model="location" type="text" placeholder="City, Country"
										class="input-field pl-10" :disabled="!canUpdateProfile" />
								</div>
							</div>
						</div>
					</div>

					<!-- Section: About -->
					<div class="bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">
						<div class="px-5 md:px-6 py-5 border-b border-heading/6 flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-sm bg-violet-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-list-ul" class="text-violet-500" scale="1.4" />
							</div>
							<div>
								<h6 class="section-title">About</h6>
								<p class="section-desc">Short bio or introduction</p>
							</div>
						</div>
						<div class="p-5 md:p-6">
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Bio</label>
								<textarea v-model="bio" rows="3" placeholder="Tell your team a bit about yourself…"
									class="input-field resize-none leading-relaxed" :disabled="!canUpdateProfile" />
								<p class="text-sm text-text mt-1.5">{{ (bio || '').length }}/500 characters</p>
							</div>
						</div>
					</div>

					<!-- Section: Change Password -->
					<div v-if="canChangePassword"
						class="bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">
						<div class="px-5 md:px-6 py-5 border-b border-heading/6 flex items-center gap-3">
							<div class="w-12 h-12 rounded-sm bg-amber-500/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-lock" scale="1.4" class="text-amber-500" />
							</div>
							<div>
								<h6 class="section-title">Change Password</h6>
								<p class="section-desc">Leave blank to keep your current password</p>
							</div>
						</div>
						<div class="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">New Password</label>
								<div class="relative">
									<input v-model="password" :type="showPassword ? 'text' : 'password'"
										placeholder="••••••••" autocomplete="new-password" class="input-field pr-10" />
									<button type="button" @click="showPassword = !showPassword"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-text hover:text-text transition-colors">
										<v-icon :name="showPassword ? 'bi-eye-slash' : 'bi-eye'" scale="0.9" />
									</button>
								</div>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Confirm Password</label>
								<div class="relative">
									<input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
										placeholder="••••••••" autocomplete="new-password" class="input-field pr-10"
										:class="{ 'border-red-400': errors.confirmPassword }"
										@input="clearError('confirmPassword')" />
									<button type="button" @click="showConfirmPassword = !showConfirmPassword"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-text hover:text-text transition-colors">
										<v-icon :name="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'" scale="0.9" />
									</button>
								</div>
								<p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">{{ errors.confirmPassword }}</p>
							</div>
						</div>
					</div>

					<!-- Change Password locked -->
					<div v-else class="bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">
						<div class="px-5 md:px-6 py-4 flex items-center gap-3">
							<div class="w-9 h-9 rounded-sm bg-heading/6 flex items-center justify-center shrink-0">
								<v-icon name="bi-lock" class="text-text" scale="1.1" />
							</div>
							<div>
								<h6 class="section-title text-heading">Change Password</h6>
								<p class="section-desc">You do not have permission to change your password</p>
							</div>
						</div>
					</div>

					<!-- Save Button -->
					<div class="flex justify-end">
						<button type="submit" :disabled="loading || !canUpdateProfile" class="tazko-btn"
							:title="!canUpdateProfile ? 'You do not have permission to update your profile' : ''">
							<v-icon v-if="!loading" name="bi-check2" scale="1" />
							<v-icon v-else name="bi-arrow-repeat" class="animate-spin" scale="1" />
							{{ loading ? 'Saving…' : 'Save Changes' }}
						</button>
					</div>
				</div>
			</div>
		</form>

		<!-- ── AVATAR CROP MODAL (inline, no Teleport needed) ────── -->
		<Transition name="avatar-modal">
			<div v-if="showAvatarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
				@click="handleAvatarClickOutside" ref="avatarModalContainer">
				<!-- Backdrop -->
				<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showAvatarModal = false" />

				<!-- Panel -->
				<div
					class="avatar-modal-panel relative bg-panel rounded-sm shadow-2xl w-full max-w-2xl z-10 overflow-hidden">

					<!-- Header -->
					<div class="px-6 py-5 border-b border-heading/8 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
								<v-icon name="bi-camera" class="text-accent" scale="0.9" />
							</div>
							<h3 class="section-title">Update Avatar</h3>
						</div>
						<button type="button" @click="closeAvatarModal"
							class="w-8 h-8 rounded-sm flex items-center justify-center text-text hover:text-heading hover:bg-heading/8 transition-all">
							<v-icon name="bi-x" scale="1.2" />
						</button>
					</div>

					<!-- Body -->
					<div class="p-6">
						<input type="file" class="hidden" accept="image/*" ref="imageInput" @change="onFileChange" />

						<!-- Drop zone -->
						<div class="border-2 min-h-80 border-dashed relative rounded-sm p-4 transition-colors" :class="{
							'border-accent bg-accent/5': dragActive,
							'border-heading/15 cursor-pointer hover:border-accent/40 hover:bg-heading/[0.02]': !hasImage && !dragActive,
							'border-heading/10': hasImage && !dragActive,
						}" @dragover.prevent="dragActive = true" @dragleave="dragActive = false" @drop="onDrop">
							<div v-if="!hasImage"
								class="absolute inset-0 flex flex-col items-center justify-center gap-2"
								@click="triggerFileInput">
								<div class="w-14 h-14 rounded-sm bg-heading/6 flex items-center justify-center mb-1">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-text"
										viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
										stroke-linecap="round" stroke-linejoin="round">
										<rect x="3" y="3" width="18" height="18" rx="2" />
										<circle cx="8.5" cy="8.5" r="1.5" />
										<polyline points="21 15 16 10 5 21" />
									</svg>
								</div>
								<p class="text-base font-semibold text-heading">Drag & drop or click to select</p>
								<p class="text-sm text-text">PNG, JPG, GIF up to 10MB</p>
							</div>
							<div v-show="hasImage" ref="croppieEl" class="w-full h-full" />
						</div>
					</div>

					<!-- Footer -->
					<div class="px-6 py-4 border-t border-heading/8 flex justify-end gap-3">
						<button type="button" class="flex-1 tazko-btn-cancel" @click="closeAvatarModal">
							<v-icon name="bi-x" scale="1" />
							Cancel
						</button>
						<button type="button" class="flex-1 tazko-btn gap-2" @click="submitAvatar"
							:disabled="loadingAvatar || !canUpdateProfile">
							<v-icon v-if="!loadingAvatar" name="bi-check2" scale="1" />
							<v-icon v-else name="bi-arrow-repeat" class="animate-spin" scale="1" />
							Save Avatar
						</button>
					</div>
				</div>
			</div>
		</Transition>

	</div>
</template>

<style scoped>
.avatar-modal-enter-active,
.avatar-modal-leave-active {
	transition: opacity 0.2s ease;
}

.avatar-modal-enter-active :deep(.avatar-modal-panel),
.avatar-modal-leave-active :deep(.avatar-modal-panel) {
	transition: transform 0.2s ease;
}

.avatar-modal-enter-from,
.avatar-modal-leave-to {
	opacity: 0;
}

.avatar-modal-enter-from :deep(.avatar-modal-panel),
.avatar-modal-leave-to :deep(.avatar-modal-panel) {
	transform: scale(0.97);
}
</style>
