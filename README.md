
# Solar Energy Data Analysis App

This project is a React + TypeScript web application for analyzing and visualizing solar energy data. It uses Vite for fast development and build, and includes custom components for data upload, charting, and solar calculations.

## Features

- **Upload and process energy usage data** (CSV, JSON)
- **Interactive charts** for energy production and usage
- **Solar installation controls** to simulate and compare scenarios
- **Custom utilities** for solar calculations and data processing
- **Modern UI** built with React and TypeScript

## Project Structure

- `src/components/` — UI components (charts, file upload, controls)
- `src/data/` — Example data files and mock data
- `src/utils/` — Data and solar calculation utilities
- `public/` — Static assets

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Open** [http://localhost:5173](http://localhost:5173) in your browser.

## ESLint & Code Quality

The project uses ESLint with type-aware and React-specific rules. See `eslint.config.js` for configuration details. You can further expand linting by installing [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom).

Example config:
```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Data Files

Place your energy usage or solar data files in `src/data/`. Supported formats: CSV, JSON.

## License

MIT

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
