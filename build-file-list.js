const fs = require('fs');
const path = require('path');

const PROCESS_MODELS_DIR = path.join(__dirname, 'process-models');
const OUTPUT_FILE = path.join(__dirname, 'dist', 'files.json');

// Ensure dist directory exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Read BPMN files from process-models directory
fs.readdir(PROCESS_MODELS_DIR, (err, files) => {
  if (err) {
    console.error('Could not read process-models directory:', err);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([]));
    return;
  }

  const bpmnFiles = files.filter(f => f.endsWith('.bpmn'));
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bpmnFiles, null, 2));
  console.log(`Generated file list with ${bpmnFiles.length} BPMN files`);
});
