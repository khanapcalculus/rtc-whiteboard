# GitHub Pages Deployment Guide

## Automatic Deployment (Recommended)

The project is configured with GitHub Actions for automatic deployment to GitHub Pages.

### Setup:
1. Push your code to the `main` branch of your `khanapcalculus/vite` repository
2. GitHub Actions will automatically build and deploy the app
3. The app will be available at: https://khanapcalculus.github.io/vite/

### GitHub Pages Settings:
1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "Deploy from a branch"
4. Select "gh-pages" branch
5. Select "/ (root)" folder

## Manual Deployment

If you prefer to deploy manually:

```bash
cd rtc-whiteboard
npm run deploy
```

This will:
1. Build the project (`npm run build`)
2. Deploy the `dist` folder to the `gh-pages` branch

## Important Notes

- The app is configured with base path `/vite/` for GitHub Pages
- WebSocket functionality (real-time collaboration) won't work on GitHub Pages as it's a static hosting service
- For full functionality with real-time collaboration, consider deploying to services like Vercel, Netlify, or Railway that support WebSocket connections

## Project Structure

```
rtc-whiteboard/
├── .github/workflows/deploy.yml  # GitHub Actions workflow
├── dist/                         # Built files (generated)
├── src/                          # Source code
├── package.json                  # Dependencies and scripts
├── vite.config.ts               # Vite configuration with GitHub Pages base
└── ...
```

## Troubleshooting

- If deployment fails, check the GitHub Actions logs in the "Actions" tab
- Make sure the repository has GitHub Pages enabled
- Verify the base path in `vite.config.ts` matches your repository name 