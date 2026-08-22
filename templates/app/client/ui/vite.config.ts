import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.resolve();

function earlyCssPlugin(): Plugin {
  return {
    name: 'early-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const linkMatch = html.match(/<link rel="stylesheet"[^>]*href="[^"]+\.css"[^>]*>/);

        if (!linkMatch) {
          return html;
        }

        const linkTag = linkMatch[0];
        const withoutLink = html.replace(linkTag, '');

        return withoutLink.replace('</title>', `</title>\n    ${linkTag}`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), earlyCssPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
