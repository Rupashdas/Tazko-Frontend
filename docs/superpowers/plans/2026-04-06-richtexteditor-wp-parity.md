# RichTextEditor WP Classic Editor Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring RichTextEditor.vue to WordPress Classic Editor feature parity with two-row Kitchen Sink toolbar, real emoji picker, link dialog, color/highlight pickers, headings, alignment, tables, undo/redo, and word count.

**Architecture:** Split monolithic RichTextEditor.vue into RichTextEditor.vue (orchestrator), EditorToolbar.vue (all toolbar UI), EmojiPickerPanel.vue, LinkDialog.vue, and ColorPickerPanel.vue. Editor instance owned by RichTextEditor, passed as prop to EditorToolbar.

**Tech Stack:** Vue 3 (script setup), Tiptap v3, oh-vue-icons, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/shared/RichTextEditor.vue` | Modify | Editor instance, all extensions, v-model, public API |
| `src/components/shared/EditorToolbar.vue` | Create | Two-row toolbar, Kitchen Sink toggle, panel triggers |
| `src/components/shared/EmojiPickerPanel.vue` | Create | Category tabs, emoji grid, search |
| `src/components/shared/LinkDialog.vue` | Create | URL input, new-tab checkbox, insert/remove/cancel |
| `src/components/shared/ColorPickerPanel.vue` | Create | Text color + highlight swatches |
| `src/components/shared/FileAttachmentPlugin.js` | Unchanged | — |
| `src/components/shared/FileAttachmentView.vue` | Unchanged | — |

---

## Task 1: Install new Tiptap extensions

- [ ] Run: `cd C:/laragon/www/tazko/tazko-frontend && npm install @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight @tiptap/extension-superscript @tiptap/extension-subscript @tiptap/extension-character-count @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header`
- [ ] Verify: `node_modules/@tiptap/extension-text-align` exists
- [ ] Commit: `feat: install tiptap wp-parity extensions`

---

## Task 2: Create ColorPickerPanel.vue

**File:** `src/components/shared/ColorPickerPanel.vue`

Props: none. Emits: `pick({ type: 'color'|'highlight', value: string|null })`.
Two sections: 30 text-color swatches + remove button, 20 highlight swatches + remove button.
`@mousedown.prevent` on root to avoid stealing focus from editor.

- [ ] Create file with component code
- [ ] Commit

---

## Task 3: Create EmojiPickerPanel.vue

**File:** `src/components/shared/EmojiPickerPanel.vue`

Category tabs (Smileys, People, Nature, Food, Travel, Objects, Symbols) with icon badges.
Search input: when empty shows active category; when filled shows all emojis flat.
Emits: `pick(emoji: string)`.
Static emoji data array bundled in component — no external library.

- [ ] Create file with component code
- [ ] Commit

---

## Task 4: Create LinkDialog.vue

**File:** `src/components/shared/LinkDialog.vue`

Props: `modelValue: boolean`, `initialUrl: string`, `initialNewTab: boolean`.
Emits: `update:modelValue`, `insert({ href, target })`, `remove`.
Auto-focuses URL input on open. Pre-fills URL if cursor is on existing link.
Teleported to body, positioned via CSS fixed center or near trigger.

- [ ] Create file with component code
- [ ] Commit

---

## Task 5: Create EditorToolbar.vue

**File:** `src/components/shared/EditorToolbar.vue`

Props: `editor` (Tiptap instance), `enableMention: boolean`, `accept: string`.
Emits: `triggerFileUpload`, `insertMention`.

**Row 1 (always visible):**
Undo | Redo | divider | Bold Italic Underline Strikethrough | divider | Align L/C/R/J | divider | Bullet Ordered | divider | Link Unlink HR | spacer | Kitchen Sink toggle

**Row 2 (v-show="showRow2"):**
Heading select (P/H1-H6/Pre) | divider | Code Codeblock Blockquote | divider | Superscript Subscript | divider | TextColor Highlight | divider | Table ops | divider | ClearFormat Attach Emoji Mention

Panels (EmojiPickerPanel, LinkDialog, ColorPickerPanel) rendered via Teleport inside this component, anchored to their trigger buttons.

- [ ] Create file with full toolbar code
- [ ] Commit

---

## Task 6: Rewrite RichTextEditor.vue

**File:** `src/components/shared/RichTextEditor.vue`

- Import and register all new extensions (TextAlign, TextStyle, Color, Highlight, Underline, Superscript, Subscript, CharacterCount, Table, TableRow, TableCell, TableHeader, Link, CodeBlock, Heading, HorizontalRule)
- Re-enable heading/horizontalRule/codeBlock in StarterKit
- Import EditorToolbar, pass `editor` prop, wire `triggerFileUpload` / `insertMention` emits
- Add word-count footer bar using `editor.storage.characterCount`
- Preserve all existing props, emits, and public API (getHTML, getText, clear, focus, isEmpty)
- Remove toolbar HTML (now in EditorToolbar.vue)

- [ ] Rewrite file
- [ ] Verify in browser: both toolbar rows visible, kitchen sink toggles row 2, all buttons functional
- [ ] Commit: `feat: wp classic editor parity on RichTextEditor`
