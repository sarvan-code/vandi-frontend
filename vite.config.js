import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/receipts': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase warning limit slightly to 800kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React dependencies into a 'vendor-react' chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Split Lucide Icons into its own chunk
          'vendor-icons': ['lucide-react'],
          // Split network/utility libraries
          'vendor-utils': ['axios', 'clsx']
        }
      }
    }
  }
})
