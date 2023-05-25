import { readFile } from "node:fs/promises";

/**
 * The shelljs package dynamically imports dependencies at runtime.
 *
 * This prevents esbuild from resolving the imports at compile-time which leads
 * to runtime errors.
 *
 * To solve this issue, we replace the `shelljs/shell.js` file with our own
 * file which imports the dependencies explicitely.
 */
export const shellJsPlugin = {
  name: "shelljs-fix",
  setup(build) {
    build.onLoad(
      { filter: /node_modules[\/\\]shelljs[\/\\]shell\.js/ },
      async () => {
        const filePath = new URL("./shell-fix.js", import.meta.url);
        const contents = await readFile(filePath, "utf8");
        return { contents };
      }
    );
  },
};
