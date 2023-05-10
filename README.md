# @tjosepo/azure-pipelines

Custom Azure Pipelines tasks.

## CloudflarePagesComment

This task creates a comment on a pull-request with the Cloudflare Pages deployment status.

This task only works if the pipeline is triggered by a pull-request. Otherwise, the task will be skipped.

To use this task, you need:

- **projectName:** Name of the Cloudflare Pages project.
- **apiToken:** Cloudflare API token. See [*Create an API token*
](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- **accountId:** Cloudflare Account ID. See [*Find zone and account IDs*](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/)

**Usage:**

```
- task: CloudflarePagesComment@0
  inputs:
    projectName: MyCoolProject
    apiToken: $(CLOUDFLARE_API_TOKEN)
    accountId: $(CLOUDFLARE_ACCOUNT_ID)
```

## Development

This project uses pnpm. You can install it with:

```
npm i -g pnpm
```

To package the extension, you first need to compile the `CloudflarePagesComment` task:

```
cd ./CloudflarePagesComment
pnpm install
pnpm run build
pnpm run prune
```

Then, at the root of the project, you can create the package with:

```
pnpm install
pnpm run package
```