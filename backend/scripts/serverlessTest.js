// backend/scripts/serverlessTest.js
// ------------------------------------------------------------
// Simulates how Vercel runs this backend, so we can test the
// deployment behaviour locally (no Vercel account needed):
//
//   1. VERCEL=1 must be set BEFORE running this script, because that
//      is exactly what Vercel sets in production.
//   2. The script imports ../index.js. On Vercel the platform imports
//      that file and uses its DEFAULT EXPORT as the request handler.
//      This test proves:
//        - index.js exports the Express app (no more
//          "No exports found in module .../index.js" error),
//        - the module does NOT start its own listener on Vercel,
//        - routes, JSON body parsing, auth and CORS still work.
//   3. The script starts the exported app itself and sends requests.
//
// Run from backend/:
//   PowerShell :  $env:VERCEL='1'; node scripts/serverlessTest.js
//   macOS/Linux:  VERCEL=1 node scripts/serverlessTest.js
// ------------------------------------------------------------

import net from "node:net";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// 1) We must run in "serverless mode" for this test to be meaningful.
if (!process.env.VERCEL) {
  console.error(
    "Set VERCEL=1 first (PowerShell: $env:VERCEL='1'). This script simulates Vercel."
  );
  process.exit(1);
}

// Is something already listening on the given port?
function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: port, host: "127.0.0.1" });

    socket.setTimeout(1500);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Pick a FREE port and point the backend at it BEFORE importing it.
// This lets us prove that the module itself does not open a listener,
// without being confused by a separate local dev server on port 5000.
let testPort = 45789;

while (await isPortInUse(testPort)) {
  testPort = testPort + 1;
}

process.env.PORT = String(testPort);

// 2) Import the backend exactly like the platform does.
const { default: app } = await import("../index.js");

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed = passed + 1;
    console.log("  PASS  " + name);
  } else {
    failed = failed + 1;
    console.log("  FAIL  " + name + (detail ? " -> " + detail : ""));
  }
}

// Small HTTP helper so we can read the status code and headers.
async function request(method, url, options = {}) {
  const headers = { "Content-Type": "application/json" };

  if (options.token) {
    headers.Authorization = "Bearer " + options.token;
  }

  if (options.origin) {
    headers.Origin = options.origin;
  }

  if (options.preflight) {
    headers["Access-Control-Request-Method"] = options.method || "POST";
  }

  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data: data, headers: response.headers };
}

async function main() {
  console.log("=== Vercel serverless compatibility test ===\n");
  console.log("VERCEL=" + process.env.VERCEL);
  console.log(
    "CORS_ORIGIN=" + (process.env.CORS_ORIGIN ? "(set)" : "(not set -> allow all)")
  );

  // --- Entry point / export ---------------------------------
  console.log("\nEntry point");
  check(
    "index.js has a default export",
    typeof app !== "undefined" && app !== null,
    "default export missing"
  );
  check("Default export is a function", typeof app === "function");
  check(
    "Default export is an Express app",
    typeof app.listen === "function" && typeof app.handle === "function"
  );

  // The module must not open its own port on Vercel. We check the free
  // port we pointed it at, so a separate local dev server cannot confuse
  // this check.
  const portBusy = await isPortInUse(testPort);
  check(
    "Module did NOT start its own listener on port " + testPort,
    !portBusy,
    "something is listening on " + testPort
  );

  // --- Start the exported app like the platform does ---------
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const port = server.address().port;
  const base = "http://localhost:" + port;

  console.log("\nRequests (app invoked as the serverless handler)");
  console.log("  test server on " + base);

  const root = await request("GET", base + "/");
  check(
    "GET / -> 200",
    root.status === 200 && root.data && root.data.message,
    "status " + root.status
  );

  const health = await request("GET", base + "/api/health");
  check(
    "GET /api/health -> 200 ok",
    health.status === 200 && health.data.status === "ok",
    JSON.stringify(health.data)
  );

  // These two go through the ensureDatabase middleware, which is the
  // serverless-only path (no startServer() ran before this request).
  const ideas = await request("GET", base + "/api/ideas");
  check(
    "GET /api/ideas -> 200 (database middleware works)",
    ideas.status === 200 && Array.isArray(ideas.data.ideas),
    "status " + ideas.status
  );

  const board = await request("GET", base + "/api/leaderboard");
  check(
    "GET /api/leaderboard -> 200",
    board.status === 200 && Array.isArray(board.data.leaderboard),
    "status " + board.status
  );

  // Body parsing: express.json() must still work inside the function.
  // We send invalid VALUES so nothing is written to the database, but the
  // error message proves the body was parsed (it names the email field).
  const badRegister = await request("POST", base + "/api/auth/register", {
    body: { name: "X", email: "not-an-email", password: "123" },
  });
  const errorMessages = badRegister.data && badRegister.data.errors;
  check(
    "POST /api/auth/register (invalid) -> 400",
    badRegister.status === 400,
    "status " + badRegister.status
  );
  check(
    "JSON request body was parsed (field-level validation ran)",
    Array.isArray(errorMessages) &&
      errorMessages.some((message) => message.includes("email")),
    JSON.stringify(errorMessages)
  );

  const noToken = await request("POST", base + "/api/ideas", {
    body: {
      problem: "A problem that is long enough",
      solution: "A solution that is long enough",
      targetCustomer: "Nobody",
      roastLevel: "Mild",
    },
  });
  check(
    "POST /api/ideas without token -> 401 (auth protected)",
    noToken.status === 401,
    "status " + noToken.status
  );

  const notFound = await request("GET", base + "/api/no-such-route");
  check("Unknown API route -> 404", notFound.status === 404, "status " + notFound.status);

  // --- CORS -------------------------------------------------
  console.log("\nCORS");
  const allowedOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")[0].trim()
    : "https://any-origin.example";
  const otherOrigin = "https://not-allowed.example";

  const preflight = await request("OPTIONS", base + "/api/ideas", {
    origin: allowedOrigin,
    preflight: true,
  });
  const allowHeader = preflight.headers.get("access-control-allow-origin");

  if (process.env.CORS_ORIGIN) {
    check(
      "Preflight from allowed origin -> Access-Control-Allow-Origin set",
      allowHeader === allowedOrigin,
      "header: " + allowHeader
    );

    const blocked = await request("OPTIONS", base + "/api/ideas", {
      origin: otherOrigin,
      preflight: true,
    });
    check(
      "Preflight from other origin -> no allow header (blocked)",
      blocked.headers.get("access-control-allow-origin") === null,
      "header: " + blocked.headers.get("access-control-allow-origin")
    );
  } else {
    // Without CORS_ORIGIN the cors package allows every origin and
    // answers with the "*" wildcard.
    check(
      "No CORS_ORIGIN set -> any origin is allowed (dev mode)",
      allowHeader === "*" || allowHeader === allowedOrigin,
      "header: " + allowHeader
    );
  }

  // --- Cleanup ----------------------------------------------
  server.close();
  await mongoose.disconnect();

  console.log("\n=== Result: " + passed + " passed, " + failed + " failed ===");

  process.exit(failed > 0 ? 1 : 0);
}

main();
