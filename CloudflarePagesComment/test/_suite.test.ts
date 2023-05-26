import { join } from 'node:path';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import { expect, test } from 'vitest';
import { buildTask } from '@tjosepo/azure-pipelines-testing-library';

const taskPath = join(__dirname, '../src/index.ts');

test('Skipped outside of pull-request', async () => {
  const task = await buildTask(taskPath);
  const result = await task.run();
  expect(result.status).toBe("Skipped");
});

// TODO: more tests, but I couldn't find much documentation on testing
// EDIT: I made my own testing lib lol
test('Throws when `projectName` is missing', async () => {
  let task = await buildTask(taskPath);
  task.setVariable("System.PullRequest.PullRequestId", "1");
  const result = await task.run();
  expect(result.status).toBe("Failed");
});
