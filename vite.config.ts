import path from 'path';
import { Readable } from 'stream';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

// In production the files in /api run as Vercel functions. In `npm run dev`
// this middleware loads the same handlers so the API keys stay server-side
// locally too, with no extra tooling.
const devApi = (): Plugin => ({
  name: 'dev-api',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const match = req.url?.match(/^\/api\/([a-z-]+)\/?(?:\?.*)?$/);
      if (!match) return next();

      try {
        const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
        const handler = mod[req.method ?? 'GET'];
        if (typeof handler !== 'function') {
          res.statusCode = 405;
          return res.end();
        }

        const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
        const request = new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
          // @ts-expect-error Node's fetch requires this for streamed bodies
          duplex: 'half',
        });
        const response: Response = await handler(request);

        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        // A missing handler file (unknown route) falls through as a 404.
        if (String(error).includes('Failed to load url')) return next();
        server.ssrFixStacktrace(error as Error);
        console.error(error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Dev API error' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  // Expose .env.local to the dev API handlers only. Nothing is passed to the
  // client bundle via `define`.
  Object.assign(process.env, loadEnv(mode, '.', ''));

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), devApi()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
