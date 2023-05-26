import * as esbuild from 'esbuild'
import azurePipelinesTaskLibFix from '@tjosepo/azure-pipelines-testing-library'

await esbuild.build({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.js',
  bundle: true,
  platform: "node",
  target: "node16",
  allowOverwrite: true,
  plugins: [azurePipelinesTaskLibFix()],
});