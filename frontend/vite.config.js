import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function crawlerDevProxyPlugin() {
  return {
    name: 'crawler-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const userAgent = req.headers['user-agent'] || '';
        const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Googlebot|bingbot/i.test(userAgent);
        const forceCrawler = req.url && req.url.includes('crawler=1');
        if (isCrawler || forceCrawler) {
          try {
            const backendRes = await fetch(`http://localhost:5005${req.url}`, {
              headers: { ...req.headers, host: 'localhost:5005' }
            });
            if (backendRes.ok) {
              const text = await backendRes.text();
              res.statusCode = backendRes.status;
              for (const [key, value] of backendRes.headers.entries()) {
                res.setHeader(key, value);
              }
              return res.end(text);
            }
          } catch {
            // If backend is unreachable, fallback to standard Vite handling
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/rf/',
  plugins: [react(), crawlerDevProxyPlugin()],
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
});
