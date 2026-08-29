import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    dts({ 
      include: ['src'],
      insertTypesEntry: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KetikinEditor',
      fileName: (format) => `ketikin-editor.${format === 'es' ? 'js' : format === 'umd' ? 'umd.cjs' : format + '.js'}`,
    },
    rollupOptions: {
      // Must externalize jsx-runtime as well, otherwise Rollup bundles React internals 
      // which causes duplicate React instance errors in consumers like Next.js
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  server: {
    port: 5555,
    open: '/dev/index.html',
  },
});
