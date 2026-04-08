# RichTextEditor — WordPress Classic Editor Parity

**Date:** 2026-04-06  
**Status:** Approved

## Goal

Bring `RichTextEditor.vue` to full feature parity with the WordPress Classic Editor (TinyMCE-based), including a two-row collapsible "Kitchen Sink" toolbar, real emoji picker, link dialog, color pickers, headings, alignment, tables, undo/redo, word count, and all inline formatting options.

## Architecture

Split the current monolithic `RichTextEditor.vue` into focused sub-components:

```
src/components/shared/
├── RichTextEditor.vue        ← orchestrator: editor instance, extensions, v-model
├── EditorToolbar.vue         ← row 1 + row 2 (collapsible), all toolbar buttons
├── EmojiPickerPanel.vue      ← emoji grid with categories + search
├── LinkDialog.vue            ← URL input + open-in-new-tab checkbox
├── ColorPickerPanel.vue      ← text color + highlight swatches
├── FileAttachmentPlugin.js   ← unchanged
└── FileAttachmentView.vue    ← unchanged
```

`RichTextEditor.vue` owns the `Editor` instance and passes it as a prop to `EditorToolbar.vue`. Panels are rendered via `<Teleport to="body">` positioned relative to their trigger buttons. Public API (`getHTML`, `getText`, `clear`, `focus`, `isEmpty`) is preserved.

## New npm Packages

```
@tiptap/extension-underline
@tiptap/extension-text-align
@tiptap/extension-text-style
@tiptap/extension-color
@tiptap/extension-highlight
@tiptap/extension-superscript
@tiptap/extension-subscript
@tiptap/extension-character-count
@tiptap/extension-table
@tiptap/extension-table-row
@tiptap/extension-table-cell
@tiptap/extension-table-header
```

Already installed but unused: `@tiptap/extension-link`, `@tiptap/extension-underline`  
Re-enabled from StarterKit: `heading`, `horizontalRule`, `codeBlock`

## Toolbar Layout

### Row 1 (always visible)
| Group | Buttons |
|---|---|
| History | Undo, Redo |
| Format | Bold, Italic, Underline, Strikethrough |
| Align | Left, Center, Right, Justify |
| Lists | Bullet list, Numbered list |
| Insert | Link, Remove link, HR |
| Toggle | Kitchen Sink (▲/▼) |

### Row 2 (collapsible, hidden by default)
| Group | Buttons |
|---|---|
| Block | Paragraph/Heading dropdown (P, H1–H6, Preformatted) |
| Inline | Inline code, Code block, Blockquote |
| Sup/Sub | Superscript, Subscript |
| Color | Text color, Highlight |
| Table | Insert table, Add/delete row, Add/delete column, Delete table |
| Misc | Clear formatting, Attach file, Emoji picker, @Mention |

### Footer
- Live word count: `X words · Y characters`

## Component Details

### EditorToolbar.vue
- Props: `editor` (Tiptap Editor instance), `enableMention`, `accept`
- Emits: `triggerFileUpload`, `insertMention`
- Owns `showRow2`, `showEmojiPicker`, `showLinkDialog`, `showColorPicker`, `showHighlightPicker` as local refs
- Renders `<EmojiPickerPanel>`, `<LinkDialog>`, `<ColorPickerPanel>` inline (teleported)

### EmojiPickerPanel.vue
- Curated emoji list grouped by category (Smileys, People, Nature, Food, Travel, Objects, Symbols, Flags)
- Search input filters across all emojis
- Emits `pick(emoji)` → toolbar inserts via `editor.chain().focus().insertContent(emoji).run()`
- No external library — static emoji data array bundled in the component

### LinkDialog.vue
- Input: URL field (auto-focuses)
- Checkbox: "Open in new tab"
- Buttons: Insert / Remove / Cancel
- On insert: `editor.chain().focus().setLink({ href, target }).run()`
- On remove: `editor.chain().focus().unsetLink().run()`
- Pre-fills URL if cursor is already on a link

### ColorPickerPanel.vue
- Two sections: "Text Color" and "Highlight"
- 20 swatches per section (web-safe, accessible palette)
- "Remove color" / "Remove highlight" buttons
- Emits `pick({ type: 'color'|'highlight', value })` → toolbar applies

## Bugs Fixed
1. Emoji picker button did nothing — now opens `EmojiPickerPanel`
2. `heading`, `horizontalRule`, `codeBlock` were disabled in StarterKit — now re-enabled
3. `@tiptap/extension-link` and `@tiptap/extension-underline` installed but never registered — now wired up

## Preserved API
```js
defineExpose({ getHTML, getText, clear, focus, isEmpty })
// Props: modelValue, placeholder, showToolbar, enableMention, users,
//        minHeight, autofocus, accept, showActionButton, actionLabel,
//        showCancelButton, cancelLabel
// Emits: update:modelValue, submit, cancel, focus, blur
```
