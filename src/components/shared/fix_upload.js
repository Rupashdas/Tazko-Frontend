const fs = require('fs');
const path = 'RichTextEditor.vue';
let content = fs.readFileSync(path, 'utf8');

// Find and replace the uploadOne success handler
const oldCode = `		const blobSrc = target.node.attrs.src
		const isInline = target.node.type.name === 'inlineImage'
		if (isInline) {
			// Use updateAttributes for inline images to avoid flash
			editor.value.chain().updateAttributes('inlineImage', {
				attachmentId: attachment.id,
				src: streamUrl(attachment.id),
				uploading: false,
				uploadError: null,
				tempId: null,
			}).run()
		} else {
			editor.value
				.chain()
				.command(({ tr }) => {
					tr.setNodeMarkup(target.pos, null, {
						...target.node.attrs,
						attachmentId: attachment.id,
						src: streamUrl(attachment.id),
						mimeType: attachment.mime_type ?? target.node.attrs.mimeType,
						fileType: attachment.file_type ?? target.node.attrs.fileType,
						fileSize: attachment.size ?? target.node.attrs.fileSize,
						uploading: false,
						uploadError: null,
						tempId: null,
					})
					return true
				})
				.run()
		}`;

const newCode = `		const blobSrc = target.node.attrs.src
		editor.value
			.chain()
			.command(({ tr }) => {
				tr.setNodeMarkup(target.pos, null, {
					...target.node.attrs,
					attachmentId: attachment.id,
					src: streamUrl(attachment.id),
					...(target.node.type.name === 'inlineImage' ? {} : {
						mimeType: attachment.mime_type ?? target.node.attrs.mimeType,
						fileType: attachment.file_type ?? target.node.attrs.fileType,
						fileSize: attachment.size ?? target.node.attrs.fileSize,
					}),
					uploading: false,
					uploadError: null,
					tempId: null,
				})
				return true
			})
			.run()`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed uploadOne successfully');
} else {
    console.log('Pattern not found, trying alternate...');
    // Try with different whitespace
    const lines = content.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("const isInline = target.node.type.name === 'inlineImage'")) {
            console.log('Found isInline at line', i+1);
            found = true;
            break;
        }
    }
    if (!found) console.log('isInline line not found');
}
