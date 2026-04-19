import { PALETTES } from '@/resources/palettes'

/**
 * Returns the Tailwind bg-class for a user's chosen palette.
 * The mapping lives in palettes.js (avatarColor field) — single source of truth.
 * Adding a new palette there automatically covers avatars everywhere.
 *
 * Usage: :class="[paletteColor(user.palette), 'w-8 h-8 rounded-full text-white ...']"
 */
export function paletteColor(palette) {
    return PALETTES[palette]?.avatarColor ?? PALETTES.aurora.avatarColor
}
