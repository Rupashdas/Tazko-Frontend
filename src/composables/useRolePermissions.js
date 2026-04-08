/**
 * useRolePermissions
 *
 * Encapsulates all per-capability / per-module toggle logic.
 * Depends on the roleStore so it stays in sync with the
 * currently selected role automatically.
 */
import { useRoleStore } from '@/stores/useRoleStore'

export function useRolePermissions() {
	const roleStore = useRoleStore()

	/**
	 * Toggle a single capability inside a module.
	 */
	function togglePermission(module, capId) {
		const list = roleStore.selectedPermissions[module]
		const idx = list.indexOf(capId)
		idx > -1 ? list.splice(idx, 1) : list.push(capId)
	}

	/**
	 * Select all / deselect all capabilities in a module.
	 */
	function toggleSelectAll(module) {
		const allIds = roleStore.capabilities[module].map(c => c.id)
		const current = roleStore.selectedPermissions[module]

		roleStore.selectedPermissions[module] =
			current.length === allIds.length ? [] : [...allIds]
	}

	/**
	 * Whether a specific capability is checked.
	 */
	function isPermissionSelected(module, capId) {
		return roleStore.selectedPermissions[module]?.includes(capId) ?? false
	}

	/**
	 * Whether all capabilities in a module are selected.
	 */
	function isModuleFullySelected(module) {
		const caps = roleStore.capabilities[module]
		const selected = roleStore.selectedPermissions[module]
		return caps?.length > 0 && selected?.length === caps.length
	}

	/**
	 * Count of selected capabilities in a module.
	 */
	function moduleSelectedCount(module) {
		return roleStore.selectedPermissions[module]?.length ?? 0
	}

	return {
		togglePermission,
		toggleSelectAll,
		isPermissionSelected,
		isModuleFullySelected,
		moduleSelectedCount,
	}
}
