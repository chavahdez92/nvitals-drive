import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri espera un puerto fijo; en modo "mock" la UI corre en el navegador con datos simulados.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true, watch: { ignored: ['**/src-tauri/**', '**/prototype-design/**'] } },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    target: 'safari17',
    outDir: 'dist',
    // Dos páginas: la app y la plantilla del reporte (vista previa en iframe y exportación).
    rollupOptions: { input: { main: 'index.html', report: 'report.html' } },
  },
});
