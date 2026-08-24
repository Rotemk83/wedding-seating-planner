import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function localStatePlugin(): Plugin {
  return {
    name: 'local-state-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url === '/api/state' || req.url.startsWith('/api/state?'))) {
          const filePath = path.resolve('data/event-state.json');
          if (req.method === 'GET') {
            try {
              if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store');
                res.end(JSON.stringify({ state: JSON.parse(data) }));
                return;
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ state: null }));
                return;
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          } else if (req.method === 'POST') {
            try {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                const parsed = JSON.parse(body);
                const state = parsed.state || parsed;
                fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, timestamp: state.lastModified }));
              });
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    watch: {
      ignored: [
        '**/scripts/**',
        '**/data/**',
        '**/public/data/**',
        '**/*.csv',
        '**/*.json',
      ],
    },
  },
  plugins: [
    localStatePlugin(),
    react(),
    tailwindcss(),
  ],
});
