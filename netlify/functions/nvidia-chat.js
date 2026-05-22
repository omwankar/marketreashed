import handler from "../../api/nvidia/chat/completions.js";

export default async (request) => {
  const url = new URL(request.url);
  const proxyUrl = `${url.origin}/api/nvidia/chat/completions`;
  const body = request.method === "POST" ? await request.text() : undefined;
  return handler(new Request(proxyUrl, { method: request.method, body }));
};
