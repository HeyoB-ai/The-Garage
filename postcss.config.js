// Local PostCSS config — intentionally empty.
//
// Tailwind CSS v4 is processed by the `@tailwindcss/vite` plugin (see
// vite.config.ts), NOT by PostCSS. This file exists so that Vite/PostCSS does
// not walk up the directory tree and pick up an unrelated parent
// postcss.config.js (which may reference a different Tailwind version).
export default { plugins: {} };
