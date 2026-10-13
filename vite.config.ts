import {
  defineConfig,
  type EnvironmentOptions,
  type Plugin,
  lazyPlugins,
} from 'vite-plus';
import solid from 'vite-plugin-solid';
import userscript from 'rollup-plugin-userscript';
import pkg from './package.json' with { type: 'json' };

// Userscript entry points
const userscripts: Record<string, string> = {
  // 'ticket-scraper': 'src/ticket-scraper/index.ts',
  'fedex-form-filler': 'src/fedex-form-filler/index.ts',
  snow: 'src/snow/index.ts',
  // 'snow-dashboard': 'src/snow-dashboard/index.ts',
  'shadow-query-console': 'src/shadow-query-console/index.ts',
  'wordle-solver': 'src/wordle-solver/index.ts',
  'rove-demo': 'src/rove-demo/index.ts',
  'isabisabel-gacha': 'src/isabisabel-gacha/index.ts',
  // 'fulfillment-fedex-filler': 'src/fulfillment-fedex-filler/index.ts',
  // 'peoplex-scraper': 'src/peoplex-scraper/index.ts',
};

// Bookmarklet entry points
const bookmarklets: Record<string, string> = {
  'test-alert': 'src/bookmarklets/test-alert/index.ts',
  'exit copy row': 'src/bookmarklets/exit/copy_sheet_row.ts',
  'exit-strike-one': 'src/bookmarklets/exit/strike_one.ts',
  'accessory-delivery-confirmation':
    'src/bookmarklets/accessory/delivery_confirmation.ts',
  'computer-delivery-confirmation':
    'src/bookmarklets/computer/computer_delivery.ts',
  'computer-return-inquiry': 'src/bookmarklets/computer/return_inquiry.ts',
  'copy-selected-cells': 'src/bookmarklets/list/copySelectedCells.ts',
  delivered_close: 'src/bookmarklets/accessory/delivered_close.ts',
  copy_general_json: 'src/bookmarklets/copy_general_json.ts',
};

// Provided at runtime by the userscript's @require'd bundles
const globals: Record<string, string> = {
  // Note:
  // - VM.solid is just a third-party UMD bundle for solid-js since there is no official one
  // - If you don't want to use it, just remove `solid-js` related packages from `globals` and the `meta.js` file.
  'solid-js': 'VM.solid',
  'solid-js/web': 'VM.solid.web',
  'solid-js/store': 'VM.solid.store',
  '@violentmonkey/dom': 'VM',
  '@violentmonkey/ui': 'VM',
};

// Lint/format only source and config, like the old .eslintignore
const ignorePatterns = [
  '**/*.md',
  '**/*.css',
  '.claude/**',
  '.kiro/**',
  '.specify/**',
  'data/**',
  'dist/**',
  'graphify-out/**',
  'legacy/**',
];

const USERSCRIPT = 'us_';
const BOOKMARKLET = 'bm_';

// Vite environment names must be identifiers
const envName = (prefix: string, name: string) =>
  prefix + name.replace(/\W/g, '_');

// Each entry gets its own environment because IIFE output can't have multiple entries
function userscriptEnv(name: string, entry: string): EnvironmentOptions {
  return {
    consumer: 'client',
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      copyPublicDir: false,
      modulePreload: false,
      minify: false,
      rolldownOptions: {
        input: entry,
        external: Object.keys(globals),
        output: {
          format: 'iife',
          entryFileNames: `${name}.user.js`,
          globals,
        },
      },
    },
  };
}

function bookmarkletEnv(name: string, entry: string): EnvironmentOptions {
  return {
    consumer: 'client',
    build: {
      outDir: 'dist/bookmarklets',
      emptyOutDir: false,
      copyPublicDir: false,
      modulePreload: false,
      minify: true,
      rolldownOptions: {
        input: entry,
        output: {
          format: 'es',
          entryFileNames: `${name}.js`,
        },
      },
    },
  };
}

// rollup-plugin-userscript is split in two for Vite's plugin ordering:
// - `?userscript-metadata` must resolve before Vite's core resolver (enforce: 'pre')
// - GM_* grant detection parses each module, so it must see JS/TS already transpiled by
//   Vite's core plugins and solid(), i.e. run at normal order
function userscriptMeta(): Plugin[] {
  const { transform, ...plugin } = userscript((meta) =>
    meta.replace('process.env.AUTHOR', pkg.author),
  ) as Plugin;
  const scan = transform as (this: unknown, code: string, id: string) => void;
  const applyToEnvironment: Plugin['applyToEnvironment'] = (env) =>
    env.name.startsWith(USERSCRIPT);
  return [
    { ...plugin, enforce: 'pre', applyToEnvironment },
    {
      name: 'userscript-grants',
      applyToEnvironment,
      transform(code, id) {
        if (/\.[cm]?[jt]sx?$/.test(id.split('?')[0])) scan.call(this, code, id);
      },
    },
  ];
}

// Custom plugin to wrap output as bookmarklet
function bookmarkletWrapper(): Plugin {
  return {
    name: 'bookmarklet-wrapper',
    applyToEnvironment: (env) => env.name.startsWith(BOOKMARKLET),
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        // Remove any import/export statements since everything should be bundled
        let code = chunk.code;
        code = code.replace(/^import\s+.*?;?\s*$/gm, '');
        code = code.replace(/^export\s+.*?;?\s*$/gm, '');
        // Output is already minified; the only remaining newlines are inside template
        // literals, which a javascript: URL would strip, so escape them
        code = code.trim().replace(/\n/g, '\\n');
        // Collapse runs of spaces, including the indentation inside multiline email templates
        code = code.replace(/[ \t]+/g, ' ');
        // Wrap in async IIFE for bookmarklet
        chunk.code = `javascript:(async function(){${code}})();`;
      }
    },
  };
}

// In userscripts, `import css from './x.css'` yields the CSS as a string (as the old
// Rollup/plaid build did) instead of Vite injecting a <style> into the host page
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    enforce: 'pre',
    applyToEnvironment: (env) => env.name.startsWith(USERSCRIPT),
    async resolveId(source, importer, options) {
      if (!source.endsWith('.css') || source.endsWith('.module.css')) return;
      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (resolved) return `${resolved.id}?inline`;
    },
  };
}

export default defineConfig(({ mode }) => {
  const environments: Record<string, EnvironmentOptions> = {};

  if (mode === 'userscripts' || mode === 'production') {
    for (const [name, entry] of Object.entries(userscripts)) {
      environments[envName(USERSCRIPT, name)] = userscriptEnv(name, entry);
    }
  }
  if (mode === 'bookmarklets' || mode === 'production') {
    for (const [name, entry] of Object.entries(bookmarklets)) {
      environments[envName(BOOKMARKLET, name)] = bookmarkletEnv(name, entry);
    }
  }

  return {
    staged: {
      '*': 'vp check --fix',
    },
    fmt: {
      singleQuote: true,
      printWidth: 80,
      ignorePatterns,
    },
    lint: {
      jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
      rules: {
        'vite-plus/prefer-vite-plus-imports': 'error',
        // Needs strictNullChecks, which this project doesn't enable
        'typescript/no-useless-default-assignment': 'off',
        // Solid assigns `let ref` via the JSX ref attribute
        'no-unassigned-vars': 'off',
      },
      overrides: [
        // Userscript metadata blocks are comment-only by design
        {
          files: ['src/**/meta.js'],
          rules: { 'unicorn/no-empty-file': 'off' },
        },
      ],
      options: { typeAware: true, typeCheck: true },
      ignorePatterns,
    },
    plugins: lazyPlugins(() => [
      solid(),
      userscriptMeta(),
      bookmarkletWrapper(),
      inlineCss(),
    ]),
    environments,
    builder: {
      async buildApp(builder) {
        for (const name of Object.keys(environments)) {
          await builder.build(builder.environments[name]);
        }
      },
    },
  };
});
