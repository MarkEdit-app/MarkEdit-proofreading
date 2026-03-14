import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { defaultViteConfig } from 'markedit-vite';
import { fileURLToPath, URL } from 'node:url';
import mainPackage from './package.json' with { type: 'json' };

const fsShimPath = fileURLToPath(new URL('./src/shims/fs.ts', import.meta.url));

export default defineConfig(mergeConfig(defaultViteConfig(), {
  define: {
    __PKG_VERSION__: JSON.stringify(mainPackage.version),
  },
  plugins: [
    {
      name: 'harper-fs-shim',
      enforce: 'pre',
      resolveId(source, importer) {
        const importerPath = importer?.split('?')[0];
        if (!importerPath) {
          return null;
        }

        if (
          (source === 'fs' || source === 'node:fs') &&
          importerPath.endsWith('/node_modules/harper.js/dist/harper.js')
        ) {
          return fsShimPath;
        }

        return null;
      },
    },
    viteSingleFile(),
  ],
}));
