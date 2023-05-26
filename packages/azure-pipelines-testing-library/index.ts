import { access, cp, lstat, rm, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as esbuild from 'esbuild';
import azurePipelinesTaskLibFix from '@tjosepo/esbuild-plugin-azure-pipelines-task-lib-fix';
import tmp from 'tmp-promise';
import { spawn } from 'node:child_process';

type TaskStatus = "Cancelled" | "Succeeded" | "Failed" | "Skipped" | "SucceededWithIssues" | "Unknown";

interface TaskResult {
  code: number | null;
  out: string;
  status: TaskStatus
}

interface Task {
  setInput(name: string, value: string): void;
  setVariable(name: string, value, options: { isSecret?: boolean }): void;
  run(): Promise<TaskResult>;
}

export async function buildTask(path: string): Promise<Task> {
  const tmpDir = await tmp.dir({ unsafeCleanup: true });
  const outfile = join(tmpDir.path, `./bundledTask-${Math.random()}.cjs`);

  await esbuild.build({
    entryPoints: [path],
    outfile,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node16',
    plugins: [azurePipelinesTaskLibFix()]
  });

  return new Task(outfile);
}

class Task {
  #outfile: string;
  #env: Record<string, string> = {};

  constructor(outfile: string) {
    this.#outfile = outfile;
  }

  setInput(name: string, value: string) {
    const key = name.replace(/\./g, '_').replace(/ /g, '_').toUpperCase();
    this.#env[`INPUT_${key}`] = value;
  }

  setTaskVariable(name: string, value: string, options: { isSecret?: boolean } = {}) {
    const { isSecret = false } = options;
    const key = name.replace(/\./g, '_').replace(/ /g, '_').toUpperCase();
    if (isSecret) {
      this.#env[`SECRET_${key}`] = value;
    } else {
      this.#env[`VSTS_TASKVARIABLE_${key}`] = value;
    }
  }

  setVariable(name: string, value: string, ) {
    this.setTaskVariable(name, value, { isSecret: true });
  }

  async run() {
    let stdout = '';
    return new Promise<TaskResult>((resolve) => {
      const childProcess = spawn("node", [this.#outfile], {
        stdio: 'pipe',
        env: this.#env,
      });
      
      childProcess.stdout.on('data', (data) => {
        stdout += data;
      });

      childProcess.on('exit', (code) => {
        const status = (() => {
          const match = stdout.match(/##vso\[task\.complete result=(\w+);\]/);
          if (match) {
            return match[1] as TaskStatus;
          }
          return "Unknown";
        })();

        resolve({ code, out: stdout, status });
      });
    });
  }
}

