import * as path from 'node:path';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import { expect, test } from 'vitest';

test('Skipped outside of pull-request', async () => {
  let tp = path.join(__dirname, 'outside-pull-request.js');
  let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

  tr.run();
  expect(tr.succeeded).toBeTruthy()
  expect(tr.warningIssues.length).toBe(0);
  expect(tr.errorIssues.length).toBe(0);
  expect(tr.stdout.includes("result=Skipped")).toBeTruthy();
});

// TODO: more tests, but I couldn't find much documentation on testing
// test('Throws when `projectName` is missing', async () => {
//   let tp = path.join(__dirname, 'missing-name-param.js');
//   let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

//   tr.run();
//   console.log(tr.stdout)
  
//   expect(tr.succeeded).toBeTruthy()
//   expect(tr.warningIssues.length).toBe(0);
//   expect(tr.errorIssues.length).toBe(1);
//   expect(tr.stdout.includes("result=Skipped")).toBeTruthy();
// });
