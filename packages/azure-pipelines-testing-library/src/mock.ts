import { headersToObject } from "headers-polyfill";

export async function serializeResponse(
  response: Response,
  requestId: string
): Promise<string> {
  const responseText = await response.text();

  const serializedResponse = JSON.stringify({
    status: response.status,
    statusText: response.statusText,
    headers: headersToObject(response.headers),
    body: responseText,
  });

  return `response:${requestId}:${serializedResponse}`;
}
