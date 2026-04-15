import DOMPurify from 'dompurify'

/**
 * Sanitize an HTML string before binding with v-html.
 * Allows standard rich-text tags (bold, lists, links, code, etc.)
 * while stripping scripts, event handlers, and other dangerous content.
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
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'colspan', 'rowspan'],
        ALLOW_DATA_ATTR: false,
    })
}
