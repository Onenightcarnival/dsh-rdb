// Build both halves with esbuild:
//  - lib/index.js   host half, ESM for Node; the AWS SDK is bundled in so
//                   the package installs with zero runtime dependencies
//                   (dsh packages stay external — the runtime provides them)
//  - lib/client.js  browser half in dsh's lazy-CJS module-loader envelope;
//                   react / react-dom come from the shell's platform table
import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
mkdirSync('lib', { recursive: true })

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['@deepseek-ai/*'],
  legalComments: 'none',
  logLevel: 'info',
  // The AWS SDK's CJS internals require() node builtins at runtime; an ESM
  // bundle needs a real require in scope for esbuild's __require shim.
  banner: { js: `// ${pkg.name}@${pkg.version} host half — bundled with esbuild (pg ${require('pg/package.json').version}, gaussdb-node ${JSON.parse(readFileSync(new URL('./node_modules/gaussdb-node/package.json', import.meta.url), 'utf8')).version} inlined)
import { createRequire as __dshRdbCreateRequire } from 'node:module';
const require = __dshRdbCreateRequire(import.meta.url);` },
})

const client = await build({
  entryPoints: ['src/client/index.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', '@deepseek-ai/*'],
  loader: { '.css': 'text' },
  legalComments: 'none',
  logLevel: 'info',
})
const body = client.outputFiles[0].text
const wrapped = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(pkg.name)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
${body}
\t\treturn module.exports;
\t}
});
`
writeFileSync('lib/client.js', wrapped)
console.log('lib/client.js', (wrapped.length / 1024).toFixed(1), 'KiB')
