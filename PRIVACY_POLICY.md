# Tic Tac Toe Privacy Policy

This repository contains the privacy policy for the Tic Tac Toe mobile game.

## Serving the Privacy Policy

There are two ways to serve the privacy policy locally:

### Method 1: Using the dedicated privacy policy server

This method runs a simple Node.js server that serves the privacy policy on port 3000:

```bash
npm run privacy
```

The privacy policy will be available at http://localhost:3000

### Method 2: Using the serve package 

This method uses the `serve` package to serve all files in the current directory:

```bash
npm run serve-privacy
```

The privacy policy will be available at http://localhost:3000/privacy-policy.html

## Deployment

The privacy policy can be deployed to various hosting services:

### GitHub Pages

To deploy to GitHub Pages, push the changes to your repository, then enable GitHub Pages in the repository settings.

### Netlify or Vercel

You can deploy directly from GitHub to Netlify or Vercel by connecting your repository.

### Firebase Hosting

To deploy to Firebase:

1. Install Firebase tools: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy --only hosting`

## Customization

Make sure to update the following fields in the privacy policy before publishing:

- Effective date
- Contact email
- App name (if changed)
- Any specific features your app includes 