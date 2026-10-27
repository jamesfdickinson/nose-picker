import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8931,
    host: true, // expose on the LAN so a phone can open it for shake testing
    open: false,
  },
});
