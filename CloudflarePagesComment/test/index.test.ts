import { join } from "node:path";
import { expect, test } from "vitest";
import { buildTask } from "@tjosepo/azure-pipelines-testing-library";
import type { Deployment } from "@cloudflare/types";

const taskPath = join(__dirname, "../src/index.ts");

test("Skip when outside of pull-request", async () => {
  const task = await buildTask(taskPath);
  const result = await task.run();

  expect(result.ok).toBe(true);
  expect(result.status).toBe("Skipped");
  expect(result.statusText).toMatch(
    "Skipping. This build was not caused by a pull-request."
  );
});

test("Throws when `projectName` is missing", async () => {
  const task = await buildTask(taskPath);
  task.setVariable("System.PullRequest.PullRequestId", "1");
  task.setInput("apiToken", "apiToken");
  task.setInput("accountId", "accountId");
  const result = await task.run();

  expect(result.ok).toBe(false);
  expect(result.status).toBe("Failed");
  expect(result.statusText).toMatch("projectName");
});

test("Throws when `apiToken` is missing", async () => {
  const task = await buildTask(taskPath);
  task.setVariable("System.PullRequest.PullRequestId", "1");
  task.setInput("projectName", "projectName");
  task.setInput("accountId", "accountId");
  const result = await task.run();

  expect(result.ok).toBe(false);
  expect(result.status).toBe("Failed");
  expect(result.statusText).toMatch("apiToken");
});

test("Throws when `accountId` is missing", async () => {
  const task = await buildTask(taskPath);
  task.setVariable("System.PullRequest.PullRequestId", "1");
  task.setInput("projectName", "projectName");
  task.setInput("apiToken", "apiToken");
  const result = await task.run();

  expect(result.ok).toBe(false);
  expect(result.status).toBe("Failed");
  expect(result.statusText).toMatch("accountId");
});

test("Throws when Cloudflare credentials are invalid", async () => {
  const task = await buildTask(taskPath);
  task.setVariable("System.PullRequest.PullRequestId", "1");
  task.setVariable("Build.SourceVersion", "commitHash");
  task.setInput("projectName", "projectName");
  task.setInput("apiToken", "apiToken");
  task.setInput("accountId", "accountId");

  task.mock(
    "https://api.cloudflare.com/client/v4/accounts/accountId/pages/projects/projectName/deployments",
    () => {
      return new Response(undefined, { status: 401 });
    }
  );

  const result = await task.run();

  expect(result.status).toBe("SucceededWithIssues");
  expect(result.statusText).toMatch(
    "Could not connect to Cloudflare API. Make sure the `accountId`, `apiToken` and `projectName` are correct."
  );
});

const cloudflareResponse: { result: Partial<Deployment>[] } = {
  result: [
    {
      id: "deploymentId",
      url: "url",
      deployment_trigger: {
        type: "manual",
        metadata: {
          branch: "branchName",
          commit_message: "commitMessage",
          commit_hash: "commitHash",
        },
      },
    },
  ],
};

test("Throws when Git hash has no matching deployment", async () => {
  const task = await buildTask(taskPath);
  task.setVariable("System.PullRequest.PullRequestId", "1");
  task.setVariable("Build.SourceVersion", "WRONG_HASH");
  task.setInput("projectName", "projectName");
  task.setInput("apiToken", "apiToken");
  task.setInput("accountId", "accountId");

  task.mock(
    "https://api.cloudflare.com/client/v4/accounts/accountId/pages/projects/projectName/deployments",
    () => {
      return new Response(JSON.stringify(cloudflareResponse));
    }
  );

  const result = await task.run();

  console.log(result.message);
  expect(result.status).toBe("SucceededWithIssues");
  expect(result.statusText).toMatch(
    "Could not find deployment matching commit:"
  );
});