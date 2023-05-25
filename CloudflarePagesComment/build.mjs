import * as esbuild from 'esbuild'
import { shellJsPlugin } from '../utils/shelljs-plugin.mjs'

await esbuild.build({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.js',
  bundle: true,
  platform: "node",
  target: "node16",
  allowOverwrite: true,
  plugins: [shellJsPlugin],
});