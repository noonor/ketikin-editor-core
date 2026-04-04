# Ketikin Editor Core [DEVELOPMENT PHASE]

Professional Canvas-based Document Editor for React/HTML5, but especially for KetikinAI.

## Overview

Ketikin Editor Core is a powerful, high-performance rich text editor built entirely on HTML5 Canvas. Designed to provide a desktop-grade word processing experience directly in the browser, it features advanced text pagination, seamless document imports, and a comprehensive React-based UI ribbon.

## Features

- 🎨 **Canvas-based Rendering Engine**: Highly optimized text and shape rendering ensuring pixel-perfect layouts, just like desktop word processors.
- 📄 **Advanced Pagination**: Deterministic line-to-index mapping and text distribution across multiple pages.
- 📎 **Document Import**: Robust support for importing Microsoft Word (`.docx`) files including complex layouts, tables, and spacing.
- 🖼️ **Image & Object Management**: Insert, resize, and position images directly within the document flow.
- 📋 **Professional UI Ribbon**: A fully-featured React-based top ribbon menu (Home, Insert, Layout, etc.) mapping directly to the editor's core commands.
- ⌨️ **Keyboard Shortcuts & Keymap**: Native-feeling keyboard navigation, selection, and formatting shortcuts.
- 🔎 **Zoom & Status Bar**: Persistent document statistics (word count) and seamless zoom controls.

## Tech Stack

- **Core**: TypeScript, HTML5 Canvas API
- **UI Framework**: React 18
- **Build Tool**: Vite
- **Dependencies**: 
  - `mammoth` - For `.docx` parsing and extraction
  - `pdfjs-dist` - For PDF handling

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate into the directory
cd ketikin-editor-core

# Install dependencies
npm install
```

## Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles TypeScript and bundles the package via Vite into the `dist` folder.
- `npm run preview`: Previews the production build locally.

## Integration

The core package is exported as both ES Modules and UMD for versatile integration options.

## Contribution

Everyone can contribute to this project. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.
