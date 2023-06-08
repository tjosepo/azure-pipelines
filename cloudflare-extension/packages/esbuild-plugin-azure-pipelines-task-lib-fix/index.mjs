// @ts-check

import { readFile, copyFile} from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * The shelljs package dynamically imports dependencies at runtime.
 *
 * This prevents esbuild from resolving the imports at compile-time which leads
 * to runtime errors.
 *
 * To solve this issue, we replace the `shelljs/shell.js` file with our own
 * file which imports the dependencies explicitely.
 * 
 * @type {() => import("esbuild").Plugin}
 */
export default function azurePipelinesTaskLibFix() {
  return {
    name: "shelljs-fix",
    setup(build) {
      build.onLoad(
        { filter: /node_modules[\/\\]azure-pipelines-task-lib/ },
        async (args) => {
          const src = join(dirname(args.path), "./lib.json");
          const destDir = build.initialOptions.outfile
          ? dirname(build.initialOptions.outfile)
          : build.initialOptions.outdir;

          if (src && destDir) {
            const dest = join(destDir, "./lib.json");
            await copyFile(src, dest);
          }

          return undefined;
        }
      )
      build.onLoad(
        { filter: /node_modules[\/\\]shelljs[\/\\]shell\.js/ },
        async () => {
          const filePath = new URL("./shell.js", import.meta.url);
          const contents = await readFile(filePath, "utf8");
          return { contents };
        }
      );
    }
  }
}