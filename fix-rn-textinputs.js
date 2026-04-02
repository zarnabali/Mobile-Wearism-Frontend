const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('find app -name "*.tsx"').toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Since regex on JSX is hard, we can do a hacky generic replace, BUT
  // only if it's on a TextInput. It's safe string manipulation if we split by '<TextInput'
  const parts = content.split('<TextInput');
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      let part = parts[i];
      // find the end of the TextInput element which is either '/>' or '>'
      // But props can have nested >, let's just replace first occurrence of text-base within next few lines?
      // Actually, since tailwind classes are in className="...", it's easier.
      // We'll replace text-base -> text-[16px], text-sm -> text-[14px], etc.
      // Also inject style={{ paddingVertical: 0 }} if not present, but wait, 
      // if it has style={{, add paddingVertical: 0, 
      
      let endIdx = part.indexOf('/>');
      if (endIdx === -1) endIdx = part.indexOf('>'); // if it has children
      if (endIdx !== -1) {
        let tagContent = part.substring(0, endIdx);
        // Replace text sizes
        tagContent = tagContent.replace(/\btext-base\b/g, 'text-[16px]');
        tagContent = tagContent.replace(/\btext-sm\b/g, 'text-[14px]');
        tagContent = tagContent.replace(/\btext-lg\b/g, 'text-[18px]');
        
        // Remove direct vertical padding that causes buggy height measurements
        tagContent = tagContent.replace(/\bpy-([0-9\.]+)\b/g, 'h-14'); // replace py-* with fixed h-14 to maintain size
        tagContent = tagContent.replace(/\bpt-([0-9\.]+)\b/g, ''); 
        tagContent = tagContent.replace(/\bpb-([0-9\.]+)\b/g, ''); 
        
        // Inject paddingVertical: 0 into existing style
        if (tagContent.includes('style={{')) {
          tagContent = tagContent.replace(/style=\{\{/g, "style={{ paddingVertical: 0, ");
        } else {
          // Add style if it doesn't exist. We append it before the endIdx
          tagContent = tagContent + `\n  style={{ paddingVertical: 0 }}`;
        }
        
        parts[i] = tagContent + part.substring(endIdx);
      }
    }
    content = parts.join('<TextInput');
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed TextInput in', file);
  }
});
