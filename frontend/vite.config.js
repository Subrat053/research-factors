import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let rawBase = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/rf/';
  if (!rawBase.startsWith('/')) rawBase = `/${rawBase}`;
  if (!rawBase.endsWith('/')) rawBase = `${rawBase}/`;

  return {
    base: rawBase,
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/sitemap.xml': {
          target: 'http://localhost:5005',
          changeOrigin: true
        },
        '/sitemaps': {
          target: 'http://localhost:5005',
          changeOrigin: true
        },
        '/robots.txt': {
          target: 'http://localhost:5005',
          changeOrigin: true
        },
        '^/rf/sitemap\\.xml': {
          target: 'http://localhost:5005',
          changeOrigin: true,
          rewrite: () => '/sitemap.xml'
        },
        '^/rf/robots\\.txt': {
          target: 'http://localhost:5005',
          changeOrigin: true,
          rewrite: () => '/robots.txt'
        }
      }
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          'vendor-tanstack': ['@tanstack/react-query'],
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-table',
            '@tiptap/extension-table-cell',
            '@tiptap/extension-table-header',
            '@tiptap/extension-table-row',
            '@tiptap/extension-subscript',
            '@tiptap/extension-superscript',
            '@tiptap/extension-underline'
          ],
          'vendor-icons': ['lucide-react'],
          'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers']
        }
      }
    }
  }
};
});
