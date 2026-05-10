const fs = require('fs');
const path = './RichTextEditor.vue';

try {
    let content = fs.readFileSync(path, 'utf8');
    
    // Find the problematic section and replace it
    const searchStart = "const isInline = target.node.type.name === 'inlineImage'";
    const searchEnd = "revokeTrackedObjectUrl(blobSrc)";
    
    const idxStart = content.indexOf(searchStart);
    const idxEnd = content.indexOf(searchEnd, idxStart) + searchEnd.length;
    
    if (idxStart === -1 || idxEnd === -1) {
        console.log('Could not find the target section');
        process.exit(1);
    }
    
    const replacement = `// Swap blob preview for the real stream URL so the saved content
        // survives a reload. Keep mimeType/fileType from the server in case
        // it refined what the browser reported.
        const blobSrc = target.node.attrs.src
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
            .run()
        revokeTrackedObjectUrl(blobSrc)`;
    
    content = content.substring(0, idxStart) + replacement + content.substring(idxEnd);
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully fixed uploadOne function');
} catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
}
