import { Worker } from "node:worker_threads";
import { Command, isCommand, parseCommands } from "./command";
import { serializeResponse } from "./mock";
import { join } from "node:path";

function requestReviver(key: string, value: any) {
  switch (key) {
    case "url":
      return new URL(value);

    case "headers":
      return new Headers(value);

    default:
      return value;
  }
}

type TaskStatus =
  | "Succeeded"
  | "SucceededWithIssues"
  | "Skipped"
  | "Failed"
  | "Unknown";

interface TaskResult {
  /** A boolean indicating whether the task was successful (status other than "Failed") or not.*/
  ok: boolean;
  message: string;
  commands: Command[];
  status: TaskStatus;
  statusText: string;
}

export class Task {
  #outfile: string;
  #env: Record<string, string> = {};
  #mocks: {route: string, handler: (request: Request) => Response | Promise<Response>}[] = [];

  constructor(outfile: string) {
    this.#outfile = outfile;
  }

  setInput(name: string, value: string): void {
    const key = name.replace(/\./g, "_").replace(/ /g, "_").toUpperCase();
    this.#env[`INPUT_${key}`] = value;
  }

  setTaskVariable(name: string, value: string): void {
    const key = name.replace(/\./g, "_").replace(/ /g, "_").toUpperCase();
    this.#env[`VSTS_TASKVARIABLE_${key}`] = value;
  }

  setVariable(name: string, value: string): void {
    const key = name.replace(/\./g, "_").replace(/ /g, "_").toUpperCase();
    this.#env[`SECRET_${key}`] = value;
  }

  mock(route: string, handler: (request: Request) => Response | Promise<Response>) {
    this.#mocks.push({ route, handler });
  }

  async run() {
    let stdout = "";
    return new Promise<TaskResult>((resolve, reject) => {
      const worker = new Worker(join(__dirname, "worker.cjs"), {
        workerData: { 
          file: this.#outfile
        },
        stdout: true,
        env: this.#env,
      });

      worker.on("message", async (message) => {
        if (typeof message !== 'string' || !message.startsWith('request:')) {
          return;
        }

        const [, serializedRequest] = message.match(/^request:(.+)$/) || []
        if (!serializedRequest) {
          return
        }
        const requestJson = JSON.parse(serializedRequest, requestReviver);

        const capturedRequest = new Request(new URL(requestJson.url), {
          method: requestJson.method,
          headers: new Headers(requestJson.headers),
          body: requestJson.body,
        });

        for (const mock of this.#mocks) {
          if (mock.route === capturedRequest.url) {
            const mockedResponse = await mock.handler(capturedRequest);
            const serializedResponse = await serializeResponse(mockedResponse as any, requestJson.id);
            console.log("Sending response to worker")
            worker.postMessage(serializedResponse);
            break;
          }
        }
      });

      worker.stdout.on("data", (data) => {
        stdout += data;
      });

      worker.on("error", reject);
      
      worker.on("exit", () => {
        const commands = parseCommands(stdout);

        const [status, statusText] = commands.reduce<[TaskStatus, string]>((previous, command) => {
          if (command.type === "task.complete") {
            return [command.properties["result"] as TaskStatus, command.message];
          } else {
            return previous;
          }
        }, ["Unknown", ""]);

        const ok = status !== "Failed";

        const message = stdout
          .replace(/\r\n/g, "\n")
          .split("\n")
          .filter(line => !isCommand(line))
          .join("\n");

        resolve({ status, statusText, ok, commands, message });
      });
    });
  }
}
