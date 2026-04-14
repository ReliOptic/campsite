# QR Tree Lite 🌳

A lightweight, beautifully animated 3D QR code tree that smoothly transitions between 3D tree and 2D QR code.

## Features

- **Smooth 3D ↔ 2D Animation**: Continuous ping-pong animation with seamless transitions
- **3-Second QR Hold**: QR code stays visible for 3 seconds—enough time to scan
- **Perfect Centering**: Animation is centered exactly in the viewport
- **Corner Matching**: Four lateral corners of square blocks align smoothly during transitions
- **Lightweight**: Minimal dependencies (~5 MB vs ~150 MB full version)
- **GitHub Actions CI/CD**: Builds and deploys automatically

## Quick Start

```bash
cd qr-tree-lite
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

Push to `main` branch and GitHub Actions will automatically build and deploy to GitHub Pages.

### Setup GitHub Pages

1. Go to repository Settings → Pages
2. Set source to "GitHub Actions"
3. Push to main branch

## Animation Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| HOLD_3D | 2.0s | Full 3D tree display |
| COLLAPSE | 1.8s | Smoothly flattens to 2D QR (easeInOutSine) |
| HOLD_2D | 3.0s | Flat QR display (scannable) |
| EXPAND | 1.8s | Grows back to 3D tree (easeInOutSine) |
| **Total** | **8.6s** | Loops infinitely |

## Tech Stack

- React 18
- Vite 6
- TypeScript
- Canvas 2D API
- qrcode library
