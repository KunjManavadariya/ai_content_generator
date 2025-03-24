import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to your backend
      "/v1": {
        target: "http://localhost:3000", // Your backend server address
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
