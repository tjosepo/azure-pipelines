// @ts-check
const { workerData, parentPort } = require("worker_threads");
const { BatchInterceptor } = require("@mswjs/interceptors");
const nodeInterceptors = require("@mswjs/interceptors/presets/node").default;
const { headersToObject } = require("headers-polyfill");

const interceptor = new BatchInterceptor({
  name: "my-interceptor",
  interceptors: nodeInterceptors,
});

interceptor.apply();

interceptor.on("request", async (request, requestId) => {
  if (parentPort === null) {
    throw new Error("No parent port found");
  }

  parentPort.postMessage(await serializeRequest(request, requestId));

  let resolve;
  const promise = new Promise((_resolve) => (resolve = _resolve));

  function handleParentMessage(message) {
    if (typeof message !== "string") {
      return resolve();
    }

    if (message.startsWith(`response:${requestId}`)) {
      const [, serializedResponse] = message.match(/^response:.+?:(.+)$/) || [];

      if (!serializedResponse) {
        return resolve();
      }

      const responseJson = JSON.parse(serializedResponse);

      const mockedResponse = new Response(responseJson.body, {
        status: responseJson.status,
        statusText: responseJson.statusText,
        headers: responseJson.headers,
      });

      request.respondWith(mockedResponse);
      resolve();
    }
  }

  parentPort.on("message", handleParentMessage);

  promise.finally(() => {
    if (parentPort) {
      parentPort.removeListener("message", handleParentMessage);
    }
  });

  return promise;
});

async function serializeRequest(request, requestId) {
  const serializedRequest = JSON.stringify({
    id: requestId,
    method: request.method,
    url: request.url,
    headers: headersToObject(request.headers),
    credentials: request.credentials,
    body: ["GET", "HEAD"].includes(request.method)
      ? null
      : await request.text(),
  });
  return `request:${serializedRequest}`;
}

require(workerData.file);
