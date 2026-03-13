import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { defaultViteConfig } from 'markedit-vite';

export default defineConfig(mergeConfig(defaultViteConfig(), {
  plugins: [viteSingleFile()],
}));
