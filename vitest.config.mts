import { defineConfig } from 'vitest/config';
import mainPackage from './package.json' with { type: 'json' };

export default defineConfig({
  define: {
    __PKG_VERSION__: JSON.stringify(mainPackage.version),
  },
});
