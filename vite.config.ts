import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // React core - critical path
              if (id.includes('react') && !id.includes('react-markdown')) {
                return 'react-core';
              }
              
              // Heavy markdown processing - lazy loaded
              if (id.includes('react-markdown') || id.includes('remark-gfm')) {
                return 'markdown';
              }
              
              // AI/API functionality - lazy loaded
              if (id.includes('@google/genai')) {
                return 'ai';
              }
              
              // Node modules - separate chunk
              if (id.includes('node_modules')) {
                return 'vendor';
              }
              
              // Components that can be lazy loaded
              if (id.includes('ExplanationModal')) {
                return 'modal';
              }
            },
            chunkFileNames: (chunkInfo) => {
              // Different paths for different chunk types
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId : 'unknown';
              
              if (facadeModuleId.includes('ExplanationModal') || chunkInfo.name === 'modal') {
                return 'assets/js/lazy/[name]-[hash].js';
              }
              if (chunkInfo.name === 'markdown') {
                return 'assets/js/lazy/[name]-[hash].js';
              }
              
              return 'assets/js/[name]-[hash].js';
            },
            entryFileNames: 'assets/js/main-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
          }
        },
        chunkSizeWarningLimit: 1000
      },
      server: {
        port: 3000,
        host: true
      },
      preview: {
        port: 3000,
        host: true
      }
    };
});
