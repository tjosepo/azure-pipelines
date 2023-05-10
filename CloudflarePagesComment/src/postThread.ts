import * as tl from "azure-pipelines-task-lib/task";
import * as azdev from "azure-devops-node-api";
import {
  CommentThreadStatus,
  CommentType,
  GitPullRequestCommentThread,
} from "azure-devops-node-api/interfaces/GitInterfaces";

export default async function postThread(content: string): Promise<boolean> {
  try {
    const pullRequestId = tl.getVariable("System.PullRequest.PullRequestId");

    if (!pullRequestId) {
      tl.setResult(
        tl.TaskResult.SucceededWithIssues,
        " ⚠️ Could not post comment. Pipeline was not caused by a pull-request.",
      );
      return false;
    }

    const accessToken = tl.getEndpointAuthorizationParameter(
      "SystemVssConnection",
      "AccessToken",
      false,
    );
    const authHandler = azdev.getPersonalAccessTokenHandler(accessToken!);
    const collectionUri = tl.getVariable("System.CollectionUri");
    const repositoryId = tl.getVariable("Build.Repository.ID");
    const connection = new azdev.WebApi(collectionUri!, authHandler);
    const gitApi = await connection.getGitApi();

    const newThread: GitPullRequestCommentThread = {
      comments: [
        {
          commentType: CommentType.Text,
          content: content,
        },
      ],
      lastUpdatedDate: new Date(),
      publishedDate: new Date(),
      status: CommentThreadStatus.Unknown,
    };

    await gitApi.createThread(newThread, repositoryId!, Number(pullRequestId));

    return true;
  } catch (e: unknown) {
    tl.setResult(
      tl.TaskResult.SucceededWithIssues,
      " ⚠️ Could not post comment. Make sure the build service has the 'Contribute to pull requests' premission set to 'Allowed'.",
    );
    return false;
  }
}
