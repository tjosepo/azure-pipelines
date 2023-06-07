import * as esbuild from 'esbuild'
import azurePipelinesTaskLibFix from '@tjosepo/esbuild-plugin-azure-pipelines-task-lib-fix'

await esbuild.build({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.js',
  bundle: true,
  platform: "node",
  target: "node16",
  allowOverwrite: true,
  plugins: [azurePipelinesTaskLibFix()],
});