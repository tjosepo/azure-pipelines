import * as esbuild from "esbuild";
import azurePipelinesTaskLibFix from "@tjosepo/esbuild-plugin-azure-pipelines-task-lib-fix";
import tmp from "tmp-promise";
import { join } from "node:path";
import { Task } from "./task";

const buildCache = new Map<string, Promise<string>>();

export async function buildTask(path: string): Promise<Task> {
  if (!buildCache.has(path)) {
    const tmpDir = await tmp.dir({ unsafeCleanup: true });
    const outfile = join(tmpDir.path, `./bundledTask-${Math.random()}.cjs`);

    buildCache.set(
      path,
      new Promise((resolve, reject) => {
        esbuild
          .build({
            entryPoints: [path],
            outfile,
            bundle: true,
            format: "cjs",
            platform: "node",
            target: "node16",
            plugins: [azurePipelinesTaskLibFix()],
          })
          .then(() => resolve(outfile))
          .catch((error) => {
            buildCache.delete(path);
            reject(error);
          });
      })
    );
  }

  const outfile = await buildCache.get(path)!;
  return new Task(outfile);
}