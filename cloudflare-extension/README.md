# Cloudflare Deployment Extension

This extension contains Azure Pipelines tasks related to Cloudflare.

## CloudflarePagesComment

This task creates a comment on a pull request with the Cloudflare Pages deployment status.

This task only works if the pipeline is triggered by a pull request. Otherwise, the task will be skipped.

**Required inputs:**

- **projectName:** Name of the Cloudflare Pages project.
- **apiToken:** Cloudflare API token. See [*Create an API token*
](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- **accountId:** Cloudflare Account ID. See [*Find zone and account IDs*](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/)

**Optional inputs:**

- **azureToken:** An Azure personal access token with the "PullRequestContribute" permission for your Azure DevOps Organization. If empty, the build agent will attempt to comment using it's own permissions. 

### Usage

First, deploy the app with [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```
- script: npx wrangler pages publish dist --project-name MyCoolProject --branch $(Build.SourceBranchName) --commit-hash $(Build.SourceVersion) --commit-message "$(Build.SourceVersionMessage)"
  env:
    CLOUDFLARE_API_TOKEN: $(CLOUDFLARE_API_TOKEN)
```

Then:

```
- task: CloudflarePagesComment@0
  inputs:
    projectName: MyCoolProject
    apiToken: $(CLOUDFLARE_API_TOKEN)
    accountId: $(CLOUDFLARE_ACCOUNT_ID)
    azureToken: $(AZURE_PAT)
```