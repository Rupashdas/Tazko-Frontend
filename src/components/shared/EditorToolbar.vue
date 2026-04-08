<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiTypeBold, BiTypeItalic, BiTypeStrikethrough, BiTypeUnderline,
	BiCodeSquare, BiBlockquoteLeft,
	BiListUl, BiListOl,
	BiTextLeft, BiTextCenter, BiTextRight, BiJustify,
	BiLink45Deg,
	BiArrowCounterclockwise, BiArrowClockwise,
	BiEraser,
	BiPaperclip, BiEmojiSmile, BiAt,
	BiChevronDown, BiChevronUp,
	BiDash, BiPalette,
	BiTextIndentLeft, BiTextIndentRight,
	BiClipboard, BiClipboardCheck,
	BiHash,
} from 'oh-vue-icons/icons'

addIcons(
	BiTypeBold, BiTypeItalic, BiTypeStrikethrough, BiTypeUnderline,
	BiCodeSquare, BiBlockquoteLeft,
	BiListUl, BiListOl,
	BiTextLeft, BiTextCenter, BiTextRight, BiJustify,
	BiLink45Deg,
	BiArrowCounterclockwise, BiArrowClockwise,
	BiEraser,
	BiPaperclip, BiEmojiSmile, BiAt,
	BiChevronDown, BiChevronUp,
	BiDash, BiPalette,
	BiTextIndentLeft, BiTextIndentRight,
	BiClipboard, BiClipboardCheck,
	BiHash,
)

import ColorPickerPanel from './ColorPickerPanel.vue'
import EmojiPickerPanel from './EmojiPickerPanel.vue'
import SpecialCharsPanel from './SpecialCharsPanel.vue'
import LinkDialog from './LinkDialog.vue'

const props = defineProps({
	editor: { type: Object, default: null },
	enableMention: { type: Boolean, default: false },
	accept: { type: String, default: '*' },
	pasteAsPlainText: { type: Boolean, default: false },
})

const emit = defineEmits([
	'triggerFileUpload',
	'insertMention',
	'togglePastePlain',
])

// ── Toolbar state ──────────────────────────────────────────
const showRow2 = ref(false)

// ── Panel visibility ───────────────────────────────────────
const showColorPicker = ref(false)
const showEmojiPicker = ref(false)
const showSpecialChars = ref(false)
const showLinkDialog = ref(false)

// ── Anchor refs ────────────────────────────────────────────
const colorBtn = ref(null)
const emojiBtn = ref(null)
const specialBtn = ref(null)

// ── Panel positions ────────────────────────────────────────
const colorPos = ref({ top: 0, left: 0 })
const emojiPos = ref({ top: 0, left: 0 })
const specialPos = ref({ top: 0, left: 0 })

function openPanel(btnRef, posRef) {
	const el = btnRef.value
	if (!el) return
	const rect = el.getBoundingClientRect()
	const panelWidth = btnRef === emojiBtn ? 288 : btnRef === specialBtn ? 308 : 240
	const left = Math.min(rect.left, window.innerWidth - panelWidth - 8)
	posRef.value = { top: rect.bottom + 4, left: Math.max(8, left) }
}

function closeAllPanels() {
	showColorPicker.value = false
	showEmojiPicker.value = false
	showSpecialChars.value = false
}

function toggleColorPicker() {
	const was = showColorPicker.value
	closeAllPanels()
	showColorPicker.value = !was
	if (showColorPicker.value) openPanel(colorBtn, colorPos)
}

function toggleEmojiPicker() {
	const was = showEmojiPicker.value
	closeAllPanels()
	showEmojiPicker.value = !was
	if (showEmojiPicker.value) openPanel(emojiBtn, emojiPos)
}

function toggleSpecialChars() {
	const was = showSpecialChars.value
	closeAllPanels()
	showSpecialChars.value = !was
	if (showSpecialChars.value) openPanel(specialBtn, specialPos)
}

function onDocClick(e) {
	const anchors = [colorBtn, emojiBtn, specialBtn]
	// If clicking a toolbar button, don't close (toggle will happen)
	if (anchors.some(r => r.value?.contains(e.target))) return
	// If clicking inside a panel, don't close (panels have @click.stop)
	const panelEls = document.querySelectorAll('.cp-panel,.ep-panel,.sc-panel')
	for (const el of panelEls) {
		if (el.contains(e.target)) return
	}
	// Click was outside panels and buttons, close them
	closeAllPanels()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// ── Link dialog ────────────────────────────────────────────
const linkUrl = ref('')
const linkNewTab = ref(false)
const hasLink = computed(() => !!props.editor?.isActive('link'))

function openLinkDialog() {
	if (!props.editor) return
	const attrs = props.editor.getAttributes('link')
	linkUrl.value = attrs.href ?? ''
	linkNewTab.value = attrs.target === '_blank'
	showLinkDialog.value = true
}

function onLinkInsert({ href, target }) {
	props.editor?.chain().focus().setLink({ href, target: target ?? undefined }).run()
}

function onLinkRemove() {
	props.editor?.chain().focus().unsetLink().run()
}

// ── Color picker ───────────────────────────────────────────
function onColorPick({ type, value }) {
	if (!props.editor) return
	if (type === 'color') {
		value
			? props.editor.chain().focus().setColor(value).run()
			: props.editor.chain().focus().unsetColor().run()
	} else {
		value
			? props.editor.chain().focus().setHighlight({ color: value }).run()
			: props.editor.chain().focus().unsetHighlight().run()
	}
	showColorPicker.value = false
	props.editor?.view.focus()
}

// ── Emoji ──────────────────────────────────────────────────
function onEmojiPick(emoji) {
	props.editor?.chain().focus().insertContent(emoji).run()
	// Picker stays open to allow selecting multiple emojis
}

// ── Special chars ──────────────────────────────────────────
function onSpecialCharPick(char) {
	props.editor?.chain().focus().insertContent(char).run()
	// Picker stays open to allow selecting multiple characters
}

// ── Heading dropdown ───────────────────────────────────────
const headingValue = computed(() => {
	if (!props.editor) return 'p'
	for (let i = 1; i <= 6; i++) {
		if (props.editor.isActive('heading', { level: i })) return `h${i}`
	}
	if (props.editor.isActive('codeBlock')) return 'pre'
	return 'p'
})

function applyHeading(val) {
	if (!props.editor) return
	if (val === 'p') props.editor.chain().focus().setParagraph().run()
	else if (val === 'pre') props.editor.chain().focus().setCodeBlock().run()
	else props.editor.chain().focus().setHeading({ level: parseInt(val.replace('h', '')) }).run()
}

</script>

<template>
	<div class="border-b border-heading/6 bg-heading/[0.02]">

		<!-- ── Row 1 (always visible) ── -->
		<div class="flex items-center gap-0.5 px-2 py-[5px] flex-wrap">

			<!-- History -->
			<div class="flex items-center gap-px">
				<button type="button" class="et-btn" title="Undo (Ctrl+Z)"
					:disabled="!editor?.can().undo()"
					@click="editor?.chain().focus().undo().run()">
					<v-icon name="bi-arrow-counterclockwise" scale="0.9" />
				</button>
				<button type="button" class="et-btn" title="Redo (Ctrl+Y)"
					:disabled="!editor?.can().redo()"
					@click="editor?.chain().focus().redo().run()">
					<v-icon name="bi-arrow-clockwise" scale="0.9" />
				</button>
			</div>
			<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

			<!-- Inline format -->
			<div class="flex items-center gap-px">
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('bold') }"
					title="Bold (Ctrl+B)" @click="editor?.chain().focus().toggleBold().run()">
					<v-icon name="bi-type-bold" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('italic') }"
					title="Italic (Ctrl+I)" @click="editor?.chain().focus().toggleItalic().run()">
					<v-icon name="bi-type-italic" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('underline') }"
					title="Underline (Ctrl+U)" @click="editor?.chain().focus().toggleUnderline().run()">
					<v-icon name="bi-type-underline" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('strike') }"
					title="Strikethrough" @click="editor?.chain().focus().toggleStrike().run()">
					<v-icon name="bi-type-strikethrough" scale="0.9" />
				</button>
			</div>
			<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

			<!-- Alignment -->
			<div class="flex items-center gap-px">
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive({ textAlign: 'left' }) }"
					title="Align left" @click="editor?.chain().focus().setTextAlign('left').run()">
					<v-icon name="bi-text-left" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive({ textAlign: 'center' }) }"
					title="Align center" @click="editor?.chain().focus().setTextAlign('center').run()">
					<v-icon name="bi-text-center" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive({ textAlign: 'right' }) }"
					title="Align right" @click="editor?.chain().focus().setTextAlign('right').run()">
					<v-icon name="bi-text-right" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive({ textAlign: 'justify' }) }"
					title="Justify" @click="editor?.chain().focus().setTextAlign('justify').run()">
					<v-icon name="bi-justify" scale="0.9" />
				</button>
			</div>
			<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

			<!-- Lists -->
			<div class="flex items-center gap-px">
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('bulletList') }"
					title="Bullet list" @click="editor?.chain().focus().toggleBulletList().run()">
					<v-icon name="bi-list-ul" scale="0.9" />
				</button>
				<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('orderedList') }"
					title="Numbered list" @click="editor?.chain().focus().toggleOrderedList().run()">
					<v-icon name="bi-list-ol" scale="0.9" />
				</button>
			</div>
			<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

			<!-- Link + HR -->
			<div class="flex items-center gap-px">
				<button type="button" class="et-btn" :class="{ 'is-active': hasLink }"
					title="Insert / Edit link" @click="openLinkDialog">
					<v-icon name="bi-link-45deg" scale="0.9" />
				</button>
				<button type="button" class="et-btn" title="Horizontal rule"
					@click="editor?.chain().focus().setHorizontalRule().run()">
					<v-icon name="bi-dash" scale="0.9" />
				</button>
			</div>

			<!-- Spacer -->
			<div class="flex-1" />

			<!-- Kitchen Sink toggle -->
			<button type="button" class="et-btn text-text/40" :class="{ 'is-active': showRow2 }"
				:title="showRow2 ? 'Hide advanced toolbar' : 'Show advanced toolbar'"
				@click="showRow2 = !showRow2">
				<v-icon :name="showRow2 ? 'bi-chevron-up' : 'bi-chevron-down'" scale="0.85" />
			</button>
		</div>

		<!-- ── Row 2 (collapsible) ── -->
		<Transition name="et-row2">
			<div v-if="showRow2" class="flex items-center gap-0.5 px-2 py-[5px] flex-wrap border-t border-heading/5">

				<!-- Heading / Block format -->
				<div class="flex items-center gap-px">
					<select
						class="h-[26px] px-1.5 border border-heading/12 rounded-[5px] bg-heading/[0.03] text-text text-[0.78rem] font-medium cursor-pointer outline-none focus:border-accent min-w-[108px]"
						:value="headingValue" title="Block format"
						@change="applyHeading($event.target.value)">
						<option value="p">Paragraph</option>
						<option value="h1">Heading 1</option>
						<option value="h2">Heading 2</option>
						<option value="h3">Heading 3</option>
						<option value="h4">Heading 4</option>
						<option value="h5">Heading 5</option>
						<option value="h6">Heading 6</option>
						<option value="pre">Preformatted</option>
					</select>
				</div>
				<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

				<!-- Indent / Outdent -->
				<div class="flex items-center gap-px">
					<button type="button" class="et-btn" title="Decrease indent (Shift+Tab)"
						@click="editor?.chain().focus().outdent().run()">
						<v-icon name="bi-text-indent-right" scale="0.9" />
					</button>
					<button type="button" class="et-btn" title="Increase indent (Tab)"
						@click="editor?.chain().focus().indent().run()">
						<v-icon name="bi-text-indent-left" scale="0.9" />
					</button>
				</div>
				<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

				<!-- Code block / Blockquote -->
				<div class="flex items-center gap-px">
					<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('codeBlock') }"
						title="Code block" @click="editor?.chain().focus().toggleCodeBlock().run()">
						<v-icon name="bi-code-square" scale="0.9" />
					</button>
					<button type="button" class="et-btn" :class="{ 'is-active': editor?.isActive('blockquote') }"
						title="Blockquote" @click="editor?.chain().focus().toggleBlockquote().run()">
						<v-icon name="bi-blockquote-left" scale="0.9" />
					</button>
				</div>
				<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

				<!-- Color -->
				<div class="flex items-center gap-px">
					<button ref="colorBtn" type="button" class="et-btn relative gap-0.5"
						:class="{ 'is-active': showColorPicker }"
						title="Text color & Highlight"
						@click="toggleColorPicker">
						<v-icon name="bi-palette" scale="0.9" />
						<span class="block w-[10px] h-[3px] rounded-[2px] bg-accent" />
					</button>
				</div>
				<div class="w-px h-4 bg-heading/10 mx-[3px] shrink-0" />

				<!-- Misc -->
				<div class="flex items-center gap-px">
					<button type="button" class="et-btn" title="Clear formatting"
						@click="editor?.chain().focus().unsetAllMarks().clearNodes().run()">
						<v-icon name="bi-eraser" scale="0.9" />
					</button>
					<button ref="specialBtn" type="button" class="et-btn"
						:class="{ 'is-active': showSpecialChars }"
						title="Special characters"
						@click="toggleSpecialChars">
						<v-icon name="bi-hash" scale="0.9" />
					</button>
					<button type="button" class="et-btn"
						:class="{ 'is-active': pasteAsPlainText }"
						title="Paste as plain text (strips formatting)"
						@click="emit('togglePastePlain')">
						<v-icon :name="pasteAsPlainText ? 'bi-clipboard-check' : 'bi-clipboard'" scale="0.9" />
					</button>
					<button type="button" class="et-btn" title="Attach file"
						@click="emit('triggerFileUpload')">
						<v-icon name="bi-paperclip" scale="0.9" />
					</button>
					<button ref="emojiBtn" type="button" class="et-btn"
						:class="{ 'is-active': showEmojiPicker }"
						title="Emoji"
						@click="toggleEmojiPicker">
						<v-icon name="bi-emoji-smile" scale="0.9" />
					</button>
					<button v-if="enableMention" type="button" class="et-btn"
						title="Mention someone (@)"
						@click="emit('insertMention')">
						<v-icon name="bi-at" scale="0.9" />
					</button>
				</div>
			</div>
		</Transition>

		<!-- ── Floating panels ── -->

		<Teleport to="body">
			<Transition name="tb-panel">
				<div v-if="showColorPicker"
					class="fixed z-[9999] bg-panel border border-heading/9 rounded-[0.4rem] shadow-[0_8px_30px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden cp-panel"
					:style="{ top: colorPos.top + 'px', left: colorPos.left + 'px' }"
					@click.stop
					@keydown.escape="closeAllPanels">
					<ColorPickerPanel @pick="onColorPick" @close="closeAllPanels" />
				</div>
			</Transition>
		</Teleport>

		<Teleport to="body">
			<Transition name="tb-panel">
				<div v-if="showEmojiPicker"
					class="fixed z-[9999] bg-panel border border-heading/9 rounded-[0.4rem] shadow-[0_8px_30px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden ep-panel"
					:style="{ top: emojiPos.top + 'px', left: emojiPos.left + 'px' }"
					@click.stop
					@keydown.escape="closeAllPanels">
					<EmojiPickerPanel @pick="onEmojiPick" @close="closeAllPanels" />
				</div>
			</Transition>
		</Teleport>

		<Teleport to="body">
			<Transition name="tb-panel">
				<div v-if="showSpecialChars"
					class="fixed z-[9999] bg-panel border border-heading/9 rounded-[0.4rem] shadow-[0_8px_30px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden sc-panel"
					:style="{ top: specialPos.top + 'px', left: specialPos.left + 'px' }"
					@click.stop
					@keydown.escape="closeAllPanels">
					<SpecialCharsPanel @pick="onSpecialCharPick" @close="closeAllPanels" />
				</div>
			</Transition>
		</Teleport>

		<LinkDialog
			v-model="showLinkDialog"
			:initial-url="linkUrl"
			:initial-new-tab="linkNewTab"
			:has-link="hasLink"
			@insert="onLinkInsert"
			@remove="onLinkRemove"
		/>
	</div>
</template>

<style scoped>
@reference "../../assets/main.css";

.et-btn {
	@apply flex items-center justify-center min-w-[28px] h-7 rounded-[5px] border-0 bg-transparent text-text/55 cursor-pointer px-1 transition-[background,color] duration-[120ms] text-[0.8rem] font-semibold leading-none;
}
.et-btn:hover:not(:disabled) {
	@apply bg-heading/7 text-heading;
}
.et-btn.is-active {
	@apply bg-accent/14 text-accent;
}
.et-btn:disabled {
	@apply opacity-35 cursor-default;
}

/* Row 2 slide transition */
.et-row2-enter-active,
.et-row2-leave-active {
	transition: max-height 0.2s ease, opacity 0.15s ease;
	overflow: hidden;
	max-height: 60px;
}
.et-row2-enter-from,
.et-row2-leave-to { max-height: 0; opacity: 0; }

/* Panel fade transition */
.tb-panel-enter-active,
.tb-panel-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.tb-panel-enter-from,
.tb-panel-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }
</style>
