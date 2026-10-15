// Sirve el prototipo (solo lectura) para compararlo con la app: pnpm vite -c scripts/vite.prototype.config.mjs
export default {
  root: 'prototype-design',
  server: { port: 4174, strictPort: true },
  plugins: [{
    name: 'prototype-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url.startsWith('/?')) req.url = '/HealthDiskInfo.dc.html';
        next();
      });
    },
  }],
};
