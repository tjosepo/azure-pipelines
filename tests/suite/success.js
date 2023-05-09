const tmrm = require("azure-pipelines-task-lib/mock-run");
const path = require("path");

let taskPath = path.join(__dirname, '..', "..", "dist", 'index.js');
let tmr = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('samplestring', 'human');

tmr.run();