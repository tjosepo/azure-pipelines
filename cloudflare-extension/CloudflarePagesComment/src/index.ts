import * as tl from "azure-pipelines-task-lib/task";
import type { Deployment } from "@cloudflare/types";
import fetch from "node-fetch";
import postThread from "./postThread.js";

async function main() {
  try {
    const buildReason = tl.getVariable("Build.Reason");

    if (buildReason !== "PullRequest") {
      console.log("Skipping. This build was not caused by a pull request.");
      tl.setResult(
        tl.TaskResult.Skipped,
        "Skipping. This build was not caused by a pull request."
      );
      return;
    }

    console.log("Reading build variables.");

    const apiToken = tl.getInput("apiToken", true);
    const accountId = tl.getInput("accountId", true);
    const projectName = tl.getInput("projectName", true);
    const commitHash = tl.getVariable("Build.SourceVersion");

    if (!commitHash) {
      tl.setResult(tl.TaskResult.Failed, " ⚠️ Could not find commit hash.");
      return;
    }

    console.log("Connecting to Cloudflare API.");

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    );

    if (!response.ok) {
      const comment = `
## ⚡ Deploying with Cloudflare Pages

<div>
  <table>
    <tbody>
      <tr>
        <td><b>Latest commit:</b></td>
        <td><code>${commitHash}</code></td>
      </tr>
      <tr>
        <td><b>Status:</b></td>
        <td>⚠️&nbsp; Could not connect to Cloudflare API.</td>
      </tr>
    </tbody>
  </table>
</div>
`;

      tl.setResult(
        tl.TaskResult.SucceededWithIssues,
        " ⚠️ Could not connect to Cloudflare API. Make sure the `accountId`, `apiToken` and `projectName` are correct."
      );

      try {
        await postThread(comment);
      } catch {
        // Ignore
      } finally {
        return;
      }
    }

    console.log("✅ Connection to Cloudflare API successful.");

    const { result } = (await response.json()) as { result: Deployment[] };
    const deployment = result.find(
      (deployment) =>
        deployment.deployment_trigger.metadata.commit_hash === commitHash
    );

    if (!deployment) {
      const comment = `
## ⚡ Deploying with Cloudflare Pages

<div>
  <table>
    <tbody>
      <tr>
        <td><b>Latest commit:</b></td>
        <td><code>${commitHash}</code></td>
      </tr>
      <tr>
        <td><b>Status:</b></td>
        <td>⚠️&nbsp; Could not find deployment.</td>
      </tr>
    </tbody>
  </table>
</div>
`;

      tl.setResult(
        tl.TaskResult.SucceededWithIssues,
        ` ⚠️ Could not find deployment matching commit: ${commitHash}`
      );

      try {
        await postThread(comment);
      } catch {
        // Ignore
      } finally {
        return;
      }
    }

    const comment = `
## ⚡ Deploying with Cloudflare Pages

<div>
  <table>
    <tbody>
      <tr>
        <td><b>Latest commit:</b></td>
        <td><code>${commitHash}</code></td>
      </tr>
      <tr>
        <td><b>Status:</b></td>
        <td>✅&nbsp; Deploy successful!</td>
      </tr>
      <tr>
        <td><b>Preview URL:<b></td>
        <td><a href="${deployment.url}" target="_blank">${deployment.url}</a></td>
      </tr>
    </tbody>
  </table>
</div>

[View logs](https://dash.cloudflare.com/?to=/:account/pages/view/${projectName}/${deployment.id})
`;

    try {
      await postThread(comment);
      console.log("✅ Comment posted successfully.");
      tl.setResult(tl.TaskResult.Succeeded, "✅ Comment posted successfully.");
    } catch {
      tl.setResult(
        tl.TaskResult.SucceededWithIssues,
        " ⚠️ Could not post comment. Make sure the build service has the 'Contribute to pull requests' premission set to 'Allowed'."
      );
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      tl.setResult(tl.TaskResult.Failed, e.message);
    } else {
      tl.setResult(tl.TaskResult.Failed, `An unknown error occured: ${e}`);
    }
  }
}

main();
