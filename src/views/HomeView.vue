<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/useProjectStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/utils/toast'
import { BiPlusCircle, BiFolder2Open, BiArrowRight, BiCheckCircle, BiClock } from 'oh-vue-icons/icons'

const router = useRouter()
const store = useProjectStore()
const auth = useAuthStore()
const { successToast } = useToast()

const loading = ref(true)

onMounted(async () => {
    try {
        await store.reset()
        await store.fetchNextPage()
    } catch (e) {
        // handled by store
    } finally {
        loading.value = false
    }
})

const projects = computed(() => store.projects)
const meta = computed(() => store.meta)

const totalProjects = computed(() => meta.value.total || 0)
const activeProjects = computed(() => meta.value.active_count || 0)
const completedProjects = computed(() => meta.value.completed_count || 0)
const avgProgress = computed(() => Math.round(meta.value.avg_progress || 0))

const totalTasks = computed(() => {
    return projects.value.reduce((sum, p) => sum + (p.task_counts?.total || 0), 0)
})

const doneTasks = computed(() => {
    return projects.value.reduce((sum, p) => sum + (p.task_counts?.done || 0), 0)
})

const recentProjects = computed(() => {
    return [...projects.value]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
})

const goToProjects = () => router.push({ name: 'projects' })
const goToProject = (id) => router.push({ name: 'project-detail', params: { id } })
const createProject = () => router.push({ name: 'projects' })

const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const daysLeft = (endDate) => {
    if (!endDate) return null
    const diff = Math.ceil((new Date(endDate) - new Date()) / 86400000)
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, cls: 'text-red-600' }
    if (diff === 0) return { text: 'Due today', cls: 'text-amber-600' }
    if (diff <= 7) return { text: `${diff}d left`, cls: 'text-amber-600' }
    return { text: `${diff}d left`, cls: 'text-text/60' }
}
</script>

<template>
    <div class="space-y-8">
        <!-- Header -->
        <div class="flex items-end justify-between gap-4 flex-wrap">
            <div>
                <p class="page-eyebrow">Dashboard</p>
                <h1 class="page-title">Welcome back, {{ auth.user?.name?.split(' ')[0] || 'there' }}</h1>
                <p class="page-subtitle">Here's what's happening across your projects today.</p>
            </div>
            <button @click="createProject" class="tazko-btn">
                <v-icon name="bi-plus-circle" scale="0.9" />
                New Project
            </button>
        </div>

        <!-- Stats -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="card p-5 animate-pulse">
                <div class="h-4 bg-heading/5 rounded w-1/2 mb-3"></div>
                <div class="h-8 bg-heading/5 rounded w-1/3"></div>
            </div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="card p-5">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-text">Total Projects</span>
                    <div class="w-8 h-8 rounded-md bg-accent/8 flex items-center justify-center">
                        <v-icon name="bi-folder2-open" scale="1" class="text-accent" />
                    </div>
                </div>
                <p class="text-2xl font-bold text-heading tracking-tight">{{ totalProjects }}</p>
                <p class="text-xs text-text mt-1">{{ activeProjects }} active</p>
            </div>

            <div class="card p-5">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-text">Total Tasks</span>
                    <div class="w-8 h-8 rounded-md bg-accent/8 flex items-center justify-center">
                        <v-icon name="bi-check2-square" scale="1" class="text-accent" />
                    </div>
                </div>
                <p class="text-2xl font-bold text-heading tracking-tight">{{ totalTasks }}</p>
                <p class="text-xs text-text mt-1">{{ doneTasks }} completed</p>
            </div>

            <div class="card p-5">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-text">Completed</span>
                    <div class="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <v-icon name="bi-check-circle" scale="1" class="text-emerald-600" />
                    </div>
                </div>
                <p class="text-2xl font-bold text-heading tracking-tight">{{ completedProjects }}</p>
                <p class="text-xs text-text mt-1">projects done</p>
            </div>

            <div class="card p-5">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-text">Avg Progress</span>
                    <div class="w-8 h-8 rounded-md bg-accent/8 flex items-center justify-center">
                        <v-icon name="bi-bar-chart" scale="1" class="text-accent" />
                    </div>
                </div>
                <p class="text-2xl font-bold text-heading tracking-tight">{{ avgProgress }}%</p>
                <p class="text-xs text-text mt-1">across all projects</p>
            </div>
        </div>

        <!-- Recent Projects -->
        <div>
            <div class="flex items-center justify-between mb-4">
                <h2 class="section-title">Recent Projects</h2>
                <button @click="goToProjects" class="tazko-btn-ghost text-sm">
                    View all
                    <v-icon name="bi-arrow-right" scale="0.8" />
                </button>
            </div>

            <div v-if="loading" class="card divide-y divide-heading/6">
                <div v-for="i in 3" :key="i" class="p-4 flex items-center gap-4 animate-pulse">
                    <div class="w-10 h-10 bg-heading/5 rounded-lg shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-heading/5 rounded w-1/3"></div>
                        <div class="h-3 bg-heading/5 rounded w-1/4"></div>
                    </div>
                </div>
            </div>

            <div v-else-if="recentProjects.length === 0" class="card p-8 text-center">
                <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <v-icon name="bi-folder2-open" scale="1.5" class="text-accent" />
                </div>
                <h3 class="section-title mb-1">No projects yet</h3>
                <p class="text-sm text-text mb-4">Get started by creating your first project.</p>
                <button @click="createProject" class="tazko-btn">
                    <v-icon name="bi-plus-circle" scale="0.9" />
                    Create Project
                </button>
            </div>

            <div v-else class="card divide-y divide-heading/6">
                <div
                    v-for="project in recentProjects"
                    :key="project.id"
                    @click="goToProject(project.id)"
                    class="flex items-center gap-4 p-4 cursor-pointer hover:bg-heading/3 transition-colors"
                >
                    <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <v-icon name="bi-folder2-open" scale="1.2" class="text-accent" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-heading truncate">{{ project.name }}</p>
                        <p class="text-xs text-text truncate">{{ project.description || 'No description' }}</p>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <div class="text-right hidden sm:block">
                            <p class="text-xs font-medium text-heading">{{ project.task_counts?.total || 0 }} tasks</p>
                            <p class="text-xs text-text">{{ project.progress }}% done</p>
                        </div>
                        <div class="w-16 h-1.5 bg-heading/8 rounded-full overflow-hidden">
                            <div class="h-full bg-accent rounded-full" :style="{ width: project.progress + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
