import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { registerAppProtocol, resolveAppPath } from "../src/app-protocol.mjs";

const root = resolve("virtual", "web-root");

test("maps only the approved app origin inside web root", () => {
  assert.equal(resolveAppPath("app://scp-survivor/", root), join(root, "index.html"));
  assert.equal(
    resolveAppPath("app://scp-survivor/assets/a.js", root),
    join(root, "assets", "a.js")
  );
  assert.throws(
    () => resolveAppPath("app://other/index.html", root),
    /Rejected app origin/
  );
  assert.throws(
    () => resolveAppPath("app://scp-survivor/%2e%2e%2fsecret", root),
    /Rejected app path/
  );
});

test("serves only the resolved app file through Electron net", () => {
  let handler;
  const requested = [];
  const protocol = {
    handle(scheme, candidate) {
      assert.equal(scheme, "app");
      handler = candidate;
    }
  };
  const net = {
    fetch(value) {
      requested.push(value);
      return "response";
    }
  };

  registerAppProtocol({ protocol, net, webRoot: root });

  assert.equal(handler({ url: "app://scp-survivor/" }), "response");
  assert.deepEqual(requested, [
    pathToFileURL(join(root, "index.html")).href
  ]);
});
