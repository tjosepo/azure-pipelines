import { MockTestRunner} from 'azure-pipelines-task-lib/mock-test';
import { TaskMockRunner} from 'azure-pipelines-task-lib/mock-run';
import { beforeAll, expect, test } from 'vitest'
import path from 'node:path';

test("Throw on bad input", () => {
  let filePath = path.join(__dirname, "suite", 'success.js');
  let runner = new MockTestRunner(filePath);

  runner.run();

  expect(runner.succeeded).toBe(true);
  expect(runner.warningIssues).toHaveLength(0);
  expect(runner.errorIssues).toHaveLength(0);

  expect(runner.stdout).toMatch("Hello human");
});