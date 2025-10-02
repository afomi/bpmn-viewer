import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

const viewer = new BpmnViewer({
  container: '#canvas'
});

const centerDiagram = canvas => {
  try {
    const elementRegistry = canvas._elementRegistry;
    if (!elementRegistry) return;

    const rootElement = canvas.getRootElement();
    if (!rootElement) return;

    const gfx = elementRegistry.getGraphics(rootElement);
    if (!gfx || typeof gfx.getBBox !== "function") return;

    const bbox = gfx.getBBox();
    const container = canvas._container;

    if (!bbox || !container) return;

    const MARGIN = 40;

    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate diagram dimensions with margin
    const diagramWidth = bbox.width + MARGIN * 2;
    const diagramHeight = bbox.height + MARGIN * 2;

    // Calculate aspect ratios
    const containerAspect = containerWidth / containerHeight;
    const diagramAspect = diagramWidth / diagramHeight;

    let viewboxWidth, viewboxHeight;

    if (diagramAspect > containerAspect) {
      // Diagram is wider - fit to width
      viewboxWidth = diagramWidth;
      viewboxHeight = diagramWidth / containerAspect;
    } else {
      // Diagram is taller - fit to height
      viewboxHeight = diagramHeight;
      viewboxWidth = diagramHeight * containerAspect;
    }

    // Center the diagram in the viewbox
    const x = bbox.x - MARGIN - (viewboxWidth - diagramWidth) / 2;
    const y = bbox.y - MARGIN - (viewboxHeight - diagramHeight) / 2;

    canvas.viewbox({
      x,
      y,
      width: viewboxWidth,
      height: viewboxHeight
    });
  } catch (error) {
    console.warn("Unable to center BPMN diagram:", error);
  }
};

// Manage local diagram list
function getLocalDiagrams() {
  const stored = localStorage.getItem('localDiagrams');
  return stored ? JSON.parse(stored) : [];
}

function saveLocalDiagrams(diagrams) {
  localStorage.setItem('localDiagrams', JSON.stringify(diagrams));
}

function addLocalDiagram(url, name) {
  const diagrams = getLocalDiagrams();
  // Avoid duplicates
  if (!diagrams.find(d => d.url === url)) {
    diagrams.push({ url, name, addedAt: Date.now() });
    saveLocalDiagrams(diagrams);
  }
}

function removeLocalDiagram(url) {
  const diagrams = getLocalDiagrams().filter(d => d.url !== url);
  saveLocalDiagrams(diagrams);
  renderFileList();
}

async function loadDiagram(url, name = null) {
  try {
    // Clear previous diagram
    viewer.clear();

    const response = await fetch(url);
    const xml = await response.text();
    await viewer.importXML(xml);

    const canvas = viewer.get('canvas');

    // Wait for rendering to complete
    setTimeout(() => centerDiagram(canvas), 0);

    // Save to localStorage
    localStorage.setItem('lastLoadedDiagram', url);

    // If loading from URL (not process-models), add to local list
    if (name && !url.startsWith('process-models/')) {
      addLocalDiagram(url, name);
      renderFileList();
    }
  } catch (err) {
    console.error('Could not load diagram', err);
    alert('Failed to load diagram: ' + err.message);
  }
}

async function bootstrapFromProcessModels() {
  // Check if we've already bootstrapped
  if (localStorage.getItem('bootstrapped')) {
    return;
  }

  try {
    const response = await fetch('dist/files.json');
    const files = await response.json();

    if (files.length > 0) {
      const diagrams = files.map(file => ({
        url: `process-models/${file}`,
        name: file,
        addedAt: Date.now()
      }));
      saveLocalDiagrams(diagrams);
    }

    localStorage.setItem('bootstrapped', 'true');
  } catch (err) {
    console.error('Could not bootstrap from process-models', err);
  }
}

function renderFileList() {
  const fileListEl = document.getElementById('file-list');
  const lastLoadedUrl = localStorage.getItem('lastLoadedDiagram');
  const diagrams = getLocalDiagrams();

  fileListEl.innerHTML = '';

  if (diagrams.length === 0) {
    return;
  }

  let loadedFromStorage = false;

  diagrams.forEach((diagram, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex items-center';

    const button = document.createElement('button');
    button.className = 'file-item flex-1';
    button.textContent = diagram.name;

    button.onclick = () => {
      document.querySelectorAll('.file-item').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      loadDiagram(diagram.url);
    };

    // Delete button (only for non-process-models URLs)
    if (!diagram.url.startsWith('process-models/')) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'px-2 py-1 text-gray-400 hover:text-red-600 transition-colors';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Remove';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Remove "${diagram.name}"?`)) {
          removeLocalDiagram(diagram.url);
        }
      };
      itemDiv.appendChild(button);
      itemDiv.appendChild(deleteBtn);
    } else {
      itemDiv.appendChild(button);
    }

    fileListEl.appendChild(itemDiv);

    // Check if this was the last loaded file
    if (lastLoadedUrl === diagram.url) {
      button.classList.add('active');
      loadDiagram(diagram.url);
      loadedFromStorage = true;
    }
  });

  // Load first diagram if nothing loaded yet
  if (!loadedFromStorage && diagrams.length > 0) {
    const firstButton = fileListEl.querySelector('.file-item');
    if (firstButton) {
      firstButton.classList.add('active');
      loadDiagram(diagrams[0].url);
    }
  }
}

async function initFileList() {
  await bootstrapFromProcessModels();
  renderFileList();
}

// Load from URL functionality
document.getElementById('load-url-btn').addEventListener('click', () => {
  const urlInput = document.getElementById('url-input');
  const url = urlInput.value.trim();

  if (!url) {
    alert('Please enter a URL');
    return;
  }

  if (!url.endsWith('.bpmn')) {
    alert('URL must point to a .bpmn file');
    return;
  }

  // Extract name from URL
  const urlParts = url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const name = fileName.replace('.bpmn', '');

  // Clear active state from file list
  document.querySelectorAll('.file-item').forEach(b => b.classList.remove('active'));

  loadDiagram(url, name);
  urlInput.value = '';
});

// Allow Enter key to load URL
document.getElementById('url-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('load-url-btn').click();
  }
});

initFileList();
