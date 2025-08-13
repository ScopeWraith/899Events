// vite.config.js
import { defineConfig } from 'vite';
import purgecss from '@fullhuman/postcss-purgecss';

export default defineConfig({
  server: {
    open: true,
  },
  // Add the new css configuration
  css: {
    postcss: {
      plugins: [
        // Add autoprefixer for browser compatibility
        'autoprefixer',
        // Add PurgeCSS but ONLY for the production build
        ...(process.env.NODE_ENV === 'production' ? [
          purgecss({
            content: [
              './index.html',              // Scan the main HTML file
              './code/js/**/*.js',         // Scan all JavaScript files
            ],
            // This is a safety net to make sure it doesn't remove classes added by JS
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
          }),
        ] : []),
      ],
    },
  },
});