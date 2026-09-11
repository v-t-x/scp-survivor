import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function resolveAppPath(requestUrl, webRoot) {
  const url = new URL(requestUrl);
  if (url.protocol !== "app:" || url.host !== "scp-survivor") {
    throw new Error("Rejected app origin");
  }

  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes("\0") || decoded.includes("\\")) {
    throw new Error("Rejected app path");
  }

  const parts = decoded.split("/").filter(Boolean);
  if (parts.includes("..")) {
    throw new Error("Rejected app path");
  }

  const candidate = resolve(webRoot, parts.length === 0 ? "index.html" : join(...parts));
  const boundary = relative(resolve(webRoot), candidate);
  if (boundary.startsWith("..") || isAbsolute(boundary)) {
    throw new Error("Rejected app path");
  }

  return candidate;
}

export function registerAppProtocol({ protocol, net, webRoot }) {
  protocol.handle("app", (request) => {
    const filePath = resolveAppPath(request.url, webRoot);
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
