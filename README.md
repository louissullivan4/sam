# SAM – Scouting Assessments Manager [![Production)](https://github.com/louissullivan4/sam/actions/workflows/prod-deploy.yml/badge.svg)](https://github.com/louissullivan4/sam/actions/workflows/prod-deploy.yml)

**SAM** is a web application for managing camping skills assessment requests and user roles for Scouting Ireland's Camping Adventure Skill Team. It is built with React, TypeScript, Vite, Firebase, and Carbon Design System.

## Tech Stack

- **Frontend**: React 22, TypeScript, Vite, Carbon Design System
- **Backend**: Firebase Auth & Firestore
- **State Management**: React hooks
- **CI/CD**: GitHub Actions, Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 22+
- Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. **Clone the repo:**
   ```sh
   git clone https://github.com/louissullivan4/sam.git
   cd sam
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure Firebase:**
   - Copy `.env.example` to `.env` and fill in your Firebase project details.

4. **Run locally:**
   ```sh
   npm run dev
   ```

5. **Build for production:**
   ```sh
   npm run build
   ```

6. **Deploy to Firebase:**
   ```sh
   firebase deploy --only hosting:prod --project prod
   ```

### Firebase Setup

- Firestore rules and indexes are in `firestore.rules` and `firestore.indexes.json`.
- See `docs/development.md` for Firebase CLI commands.

## Project Structure

```
src/
  components/      # Reusable UI components
  hooks/           # Custom React hooks
  lib/             # Utility functions
  pages/           # Route-based pages
  shell/           # App shell and layout
  firebase.ts      # Firebase config
  types.ts         # TypeScript types
public/            # Static assets
docs/              # Development docs
```

## Scripts

- `npm run dev` – Start local dev server
- `npm run build` – Build for production
- `npm run typecheck` – TypeScript check
- `npm run lint` – Lint code
- `npm run format` – Check formatting
- `npm run test` – Run tests (if present)

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Credits

Lead Developer - Louis Sullivan (@louissullivan4)
 
## License
 
The MIT License (MIT)

Copyright (c) 2025 Louis Sullivan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.