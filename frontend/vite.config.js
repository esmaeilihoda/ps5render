import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Enable polling to improve file watch reliability on Windows/WSL/VMs
    watch: {
      usePolling: true
    },
    // Ensure HMR is enabled (do not set to false)
    hmr: true
  }
});
