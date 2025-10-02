# BPMN Viewer (Business Process Model Notation)

Single-page BPMN canvas viewer built with bpmn-js and Tailwind CSS 4.

## Features

* Display .bpmn files using bpmn-js viewer
* List .bpmn files in /process-models directory
* Click on a model path to load and display it on the canvas
* Auto-center diagrams with 40px margin
* Responsive layout with sidebar navigation

## Getting Started

### Prerequisites

* Node.js (v14 or higher)

### Installation

```bash
npm install
```

### Development

1. Add your .bpmn files to the `process-models/` directory

2. Build the application:
```bash
npm run build
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3001 in your browser

## Project Structure

```
bpmn-viewer/
├── src/
│   └── app.js           # Main application logic
├── process-models/      # Place .bpmn files here
├── dist/                # Built files (generated)
├── index.html           # Main HTML file
├── server.js            # Development server
└── package.json
```

## How It Works

This is a fully static site that generates a file list at build time:

1. `build-file-list.js` scans `/process-models` and creates `dist/files.json`
2. `esbuild` bundles the app into `dist/app.js`
3. The static site can be served from any web server or GitHub Pages

No server-side logic is required at runtime!

## Technology Stack

* **bpmn-js** - BPMN 2.0 rendering library
* **Tailwind CSS 4** - Utility-first CSS framework (via CDN)
* **esbuild** - JavaScript bundler
* **Node.js** - Build tooling and dev server

## Deployment

### GitHub Pages

This project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to the main branch.

To enable GitHub Pages:

1. Go to your repository Settings → Pages
2. Under "Build and deployment", set Source to "GitHub Actions"
3. Push to the `develop` branch to trigger deployment

The site is available at: https://afomi.github.io/bpmn-viewer/
