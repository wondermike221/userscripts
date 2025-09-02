import { defineExternal, definePlugins } from '@gera2ld/plaid-rollup';
import { defineConfig } from 'rollup';
import userscript from 'rollup-plugin-userscript';
import pkg from './package.json' with { type: 'json' };

// Userscript entry points
const userscripts = {
  // 'ticket-scraper': 'src/ticket-scraper/index.ts',
  'fedex-form-filler': 'src/fedex-form-filler/index.ts',
  'snow': 'src/snow/index.ts',
  // 'fulfillment-fedex-filler': 'src/fulfillment-fedex-filler/index.ts',
  // 'peoplex-scraper': 'src/peoplex-scraper/index.ts',
};

// Bookmarklet entry points
const bookmarklets = {
  'test-alert': 'src/bookmarklets/test-alert/index.ts',
  'exit copy row': 'src/bookmarklets/exit/copy_sheet_row.ts',
  'exit-strike-one': 'src/bookmarklets/exit/strike_one.ts',
  'accessory-delivery-confirmation': 'src/bookmarklets/accessory/delivery_confirmation.ts',
  'computer-delivery-confirmation': 'src/bookmarklets/computer/computer_delivery.ts',
  'computer-return-inquiry': 'src/bookmarklets/computer/return_inquiry.ts'
};

// Custom plugin to wrap output as bookmarklet
function bookmarkletWrapper() {
  return {
    name: 'bookmarklet-wrapper',
    generateBundle(options, bundle) {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          // Convert ES module to bookmarklet format
          let code = chunk.code;

          // Remove any import/export statements since everything should be bundled
          code = code.replace(/^import\s+.*?;?\s*$/gm, '');
          code = code.replace(/^export\s+.*?;?\s*$/gm, '');

          // Clean up whitespace and wrap in async IIFE for bookmarklet
          code = code.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
          chunk.code = `javascript:(async function(){${code}})();`;
        }
      });
    }
  };
}

export default defineConfig(() => {
  const buildType = process.env.BUILD_TYPE || 'all';
  const configs = [];

  // Userscript configurations
  if (buildType === 'userscripts' || buildType === 'all') {
    configs.push(...Object.entries(userscripts).map(([name, entry]) => ({
      input: entry,
      plugins: [
        ...definePlugins({
          esm: true,
          minimize: false,
          postcss: {
            inject: false,
            minimize: true,
          },
          extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
        }),
        userscript((meta) => meta.replace('process.env.AUTHOR', pkg.author)),
      ],
      external: defineExternal([
        '@violentmonkey/ui',
        '@violentmonkey/dom',
        'solid-js',
        'solid-js/web',
      ]),
      output: {
        format: 'iife',
        file: `dist/${name}.user.js`,
        globals: {
          // Note:
          // - VM.solid is just a third-party UMD bundle for solid-js since there is no official one
          // - If you don't want to use it, just remove `solid-js` related packages from `external`, `globals` and the `meta.js` file.
          'solid-js': 'VM.solid',
          'solid-js/web': 'VM.solid.web',
          '@violentmonkey/dom': 'VM',
          '@violentmonkey/ui': 'VM',
        },
        indent: false,
      },
    })));
  }

  // Bookmarklet configurations
  if (buildType === 'bookmarklets' || buildType === 'all') {
    configs.push(...Object.entries(bookmarklets).map(([name, entry]) => ({
      input: entry,
      plugins: [
        ...definePlugins({
          esm: true,
          minimize: true,
          postcss: {
            inject: true,
            minimize: true,
          },
          extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
        }),
        bookmarkletWrapper(),
      ],
      external: [], // Bundle everything inline for bookmarklets
      output: {
        format: 'es',
        file: `dist/bookmarklets/${name}.js`,
        compact: true,
      },
    })));
  }

  return configs;
});
