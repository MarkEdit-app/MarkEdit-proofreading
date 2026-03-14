import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { defaultViteConfig } from 'markedit-vite';
import { fileURLToPath, URL } from 'node:url';
import mainPackage from './package.json' with { type: 'json' };

export default defineConfig(mergeConfig(defaultViteConfig(), {
  define: {
    __PKG_VERSION__: JSON.stringify(mainPackage.version),
  },
  resolve: {
    alias: {
      fs: fileURLToPath(new URL('./src/shims/fs.ts', import.meta.url)),
      'node:fs': fileURLToPath(new URL('./src/shims/fs.ts', import.meta.url)),
    },
  },
  plugins: [viteSingleFile()],
}));
