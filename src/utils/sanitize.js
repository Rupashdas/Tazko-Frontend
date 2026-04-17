import DOMPurify from 'dompurify'

/**
 * Sanitize an HTML string before binding with v-html.
 * Allows standard rich-text tags (bold, lists, links, code, etc.)
 * plus the custom markup produced by RichTextEditor for mention chips
 * (<span data-mention ...>) and file attachments
 * (<div data-file-attachment ...>), while stripping scripts, event
 * handlers, and other dangerous content.
 */
export function sanitize(html) {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'pre', 'code',
            'a', 'hr',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'sup', 'sub', 'mark', 'span',
            // Needed for file attachments + mention chip avatars.
            'div', 'img', 'video', 'audio',
        ],
        ALLOWED_ATTR: [
            'href', 'target', 'rel', 'class', 'colspan', 'rowspan',
            // Mention chip inline styling + avatar image.
            'style',
            // Media attributes for file attachments.
            'src', 'alt', 'controls',
            // Mention chip attributes (explicit — see ALLOW_DATA_ATTR below).
            'data-mention', 'data-user-id', 'data-name', 'data-avatar',
            'data-initials', 'data-color',
            // File attachment attributes.
            'data-file-attachment', 'data-file-name', 'data-file-type',
            'data-file-src', 'data-file-mime', 'data-file-size',
            'data-file-align',
            // Backend linkage — the real attachment row id. AttachmentSyncService
            // reads this to commit orphan uploads to their parent model.
            'data-attachment-id',
        ],
        // Keep data-* attributes so mention chips and file attachments
        // survive the sanitize pass. DOMPurify still blocks event
        // handlers (onclick, etc.) and unsafe URI schemes by default.
        ALLOW_DATA_ATTR: true,
    })
}
