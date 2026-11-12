// backend/scripts/smokeTest.js
// ------------------------------------------------------------
// End-to-end API smoke test for Startup Roast Arena.
// Run the server first (npm start), then:  node scripts/smokeTest.js
//
// Covers PROJECT_GUIDE §15 items 1-8 and 10-15:
// register, login, protected routes, ideas, AI evaluation (REAL
// Gemini call), votes, 409 duplicate, 403 self-vote / non-owner,
// leaderboard, re-pitch and version comparison.
// Uses clearly-labelled test accounts. Never prints tokens.
// ------------------------------------------------------------

import dotenv from "dotenv";

dotenv.config();

const BASE = "http://localhost:5000/api";
const ROOT = "http://localhost:5000";

// Tiny HTTP helper so we can read the status code of every call.
async function request(method, url, options = {}) {
  const headers = { "Content-Type": "application/json" };

  if (options.token) {
    headers.Authorization = "Bearer " + options.token;
  }

  try {
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

    return { status: response.status, data: data };
  } catch (error) {
    return { status: 0, data: { message: error.message } };
  }
}

// Simple pass/fail bookkeeping.
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

// Two test users so we can test voting between different accounts.
const stamp = Date.now();
const USER_A = {
  name: "Test Founder One",
  email: `smoke.founder.${stamp}@example.com`,
  password: "testpass123",
};
const USER_B = {
  name: "Test Voter Two",
  email: `smoke.voter.${stamp}@example.com`,
  password: "testpass123",
};

// Gemini sometimes answers 503 ("this model is experiencing high demand").
// The backend already handles that correctly - it returns a clear error and
// saves nothing - but the TEST should not fail because of a temporary
// capacity spike, so we retry a couple of times before giving up.
async function evaluateWithRetry(ideaId, token) {
  let response = await request("POST", BASE + "/ideas/" + ideaId + "/evaluate", {
    token: token,
  });

  for (let attempt = 2; attempt <= 3; attempt++) {
    if (response.status < 500) {
      break;
    }

    console.log(
      "  ... AI temporarily unavailable (" +
        response.status +
        "), waiting 20s before retry " +
        attempt
    );

    await new Promise((resolve) => setTimeout(resolve, 20000));

    response = await request("POST", BASE + "/ideas/" + ideaId + "/evaluate", {
      token: token,
    });
  }

  return response;
}

async function main() {
  console.log("=== Startup Roast Arena API smoke test ===\n");

  // --- Health -------------------------------------------------
  console.log("Health");
  const root = await request("GET", ROOT + "/");
  check("GET / responds", root.status === 200, "status " + root.status);

  const health = await request("GET", BASE + "/health");
  check(
    "GET /api/health -> database connected",
    health.status === 200 && health.data.database === "connected",
    JSON.stringify(health.data)
  );

  // --- Auth ---------------------------------------------------
  console.log("\nAuthentication");
  const regA = await request("POST", BASE + "/auth/register", {
    body: USER_A,
  });
  check("Register user A -> 201", regA.status === 201, "status " + regA.status);
  const tokenA = regA.data && regA.data.token;
  check("Register returns a token", Boolean(tokenA));

  const dup = await request("POST", BASE + "/auth/register", {
    body: USER_A,
  });
  check("Duplicate email -> 409", dup.status === 409, "status " + dup.status);

  const badLogin = await request("POST", BASE + "/auth/login", {
    body: { email: USER_A.email, password: "wrong-password" },
  });
  check("Wrong password -> 401", badLogin.status === 401, "status " + badLogin.status);

  const loginA = await request("POST", BASE + "/auth/login", {
    body: { email: USER_A.email, password: USER_A.password },
  });
  check("Login user A -> 200", loginA.status === 200, "status " + loginA.status);
  const loginToken = loginA.data && loginA.data.token;

  const me = await request("GET", BASE + "/auth/me", { token: loginToken });
  check(
    "GET /auth/me with token -> 200",
    me.status === 200 && me.data.user.email === USER_A.email,
    "status " + me.status
  );

  const meNoToken = await request("GET", BASE + "/auth/me");
  check("GET /auth/me without token -> 401", meNoToken.status === 401, "status " + meNoToken.status);

  const badRegister = await request("POST", BASE + "/auth/register", {
    body: { name: "X", email: "not-an-email", password: "123" },
  });
  check("Invalid register input -> 400", badRegister.status === 400, "status " + badRegister.status);

  // --- Ideas ---------------------------------------------------
  console.log("\nIdeas");
  const badIdea = await request("POST", BASE + "/ideas", {
    token: tokenA,
    body: {
      problem: "Too short",
      solution: "Also too short",
      targetCustomer: "x",
      roastLevel: "Nuclear",
    },
  });
  check("Invalid idea input -> 400", badIdea.status === 400, "status " + badIdea.status);

  const ideaBody = {
    problem: "Students waste hours finding group members for projects",
    solution: "A matchmaking app that pairs students by skills and course schedule",
    targetCustomer: "University students in Pakistan",
    roastLevel: "Spicy",
  };
  const createIdea = await request("POST", BASE + "/ideas", {
    token: tokenA,
    body: ideaBody,
  });
  check("Create idea -> 201", createIdea.status === 201, "status " + createIdea.status);
  const ideaId = createIdea.data && createIdea.data.idea && createIdea.data.idea._id;
  check("Idea id returned", Boolean(ideaId));

  const list = await request("GET", BASE + "/ideas");
  check(
    "GET /ideas lists the new idea",
    list.status === 200 &&
      list.data.ideas.some((row) => row.id === ideaId),
    "status " + list.status
  );

  const single = await request("GET", BASE + "/ideas/" + ideaId);
  check(
    "GET /ideas/:id returns version 1",
    single.status === 200 && single.data.idea.versions.length === 1,
    "status " + single.status
  );

  const badId = await request("GET", BASE + "/ideas/not-a-real-id");
  check("Malformed idea id -> 400", badId.status === 400, "status " + badId.status);

  // --- AI evaluation (REAL Gemini call) ------------------------
  console.log("\nAI evaluation (real Gemini call, please wait...)");
  const evaluate = await evaluateWithRetry(ideaId, tokenA);
  check(
    "Evaluate -> 201 with 3 reviews",
    evaluate.status === 201 &&
      evaluate.data &&
      evaluate.data.reviews &&
      evaluate.data.reviews.length === 3,
    "status " + evaluate.status + " " + JSON.stringify(evaluate.data && evaluate.data.message)
  );

  const reviews = evaluate.data && evaluate.data.reviews ? evaluate.data.reviews : [];
  const names = reviews.map((review) => review.investorName).sort();
  check(
    "Strict, Funny, Dreamer all present",
    JSON.stringify(names) ===
      JSON.stringify(["Dreamer Investor", "Funny Investor", "Strict Investor"]),
    JSON.stringify(names)
  );

  const scoresOk = reviews.every(
    (review) => review.score >= 1 && review.score <= 10
  );
  check("All scores within 1-10", scoresOk);

  const fundingOk = reviews.every((review) => review.fundingAmount <= 5000000);
  check("Funding capped at 5,000,000", fundingOk);

  const equityOk = reviews.every(
    (review) => review.equityPercentage >= 1 && review.equityPercentage <= 30
  );
  check("Equity within 1-30%", equityOk);

  const tipsOk = reviews.every(
    (review) => review.improvementTip && review.improvementTip.length > 0
  );
  check("Every review has an improvement tip", tipsOk);

  const getReviews = await request("GET", BASE + "/ideas/" + ideaId + "/reviews");
  check(
    "GET /ideas/:id/reviews -> 3",
    getReviews.status === 200 && getReviews.data.count === 3,
    "count " + (getReviews.data && getReviews.data.count)
  );

  const reviewsV1 = await request(
    "GET",
    BASE + "/ideas/" + ideaId + "/reviews?version=1"
  );
  check(
    "GET reviews?version=1 -> 3",
    reviewsV1.status === 200 && reviewsV1.data.count === 3
  );

  const reviewsV99 = await request(
    "GET",
    BASE + "/ideas/" + ideaId + "/reviews?version=99"
  );
  check(
    "GET reviews?version=99 -> 0",
    reviewsV99.status === 200 && reviewsV99.data.count === 0
  );

  // --- Voting rules --------------------------------------------
  console.log("\nVoting");
  const regB = await request("POST", BASE + "/auth/register", { body: USER_B });
  check("Register user B -> 201", regB.status === 201, "status " + regB.status);
  const tokenB = regB.data && regB.data.token;

  const selfVote = await request("POST", BASE + "/ideas/" + ideaId + "/vote", {
    token: tokenA,
  });
  check("Owner self-vote -> 403", selfVote.status === 403, "status " + selfVote.status);

  const vote1 = await request("POST", BASE + "/ideas/" + ideaId + "/vote", {
    token: tokenB,
  });
  check("User B votes -> 201", vote1.status === 201, "status " + vote1.status);

  const vote2 = await request("POST", BASE + "/ideas/" + ideaId + "/vote", {
    token: tokenB,
  });
  check("Duplicate vote -> 409", vote2.status === 409, "status " + vote2.status);

  const votesGuest = await request("GET", BASE + "/ideas/" + ideaId + "/votes");
  check(
    "GET votes (guest) -> count 1, hasVoted false",
    votesGuest.status === 200 &&
      votesGuest.data.voteCount === 1 &&
      votesGuest.data.hasVoted === false,
    JSON.stringify(votesGuest.data)
  );

  const votesB = await request("GET", BASE + "/ideas/" + ideaId + "/votes", {
    token: tokenB,
  });
  check(
    "GET votes as user B -> hasVoted true",
    votesB.status === 200 && votesB.data.hasVoted === true,
    JSON.stringify(votesB.data)
  );

  // --- Re-pitch / versions -------------------------------------
  console.log("\nRe-pitch");
  const repitchNotOwner = await request(
    "PUT",
    BASE + "/ideas/" + ideaId + "/repitch",
    { token: tokenB, body: ideaBody }
  );
  check("Non-owner re-pitch -> 403", repitchNotOwner.status === 403, "status " + repitchNotOwner.status);

  const repitch = await request("PUT", BASE + "/ideas/" + ideaId + "/repitch", {
    token: tokenA,
    body: {
      ...ideaBody,
      solution:
        "A matchmaking app that pairs students by skills, with automatic schedule matching and weekly team challenges",
    },
  });
  check(
    "Owner re-pitch -> version 2",
    repitch.status === 200 &&
      repitch.data.idea.currentVersion === 2 &&
      repitch.data.idea.versions.length === 2,
    "status " + repitch.status
  );

  const afterRepitch = await request("GET", BASE + "/ideas/" + ideaId);
  check(
    "Version 1 preserved after re-pitch",
    afterRepitch.status === 200 &&
      afterRepitch.data.idea.versions[0].versionNumber === 1 &&
      afterRepitch.data.idea.versions[0].problem === ideaBody.problem
  );

  const reviewsV2Before = await request(
    "GET",
    BASE + "/ideas/" + ideaId + "/reviews?version=2"
  );
  check(
    "Version 2 has no reviews yet",
    reviewsV2Before.status === 200 && reviewsV2Before.data.count === 0
  );

  const evaluateV2 = await evaluateWithRetry(ideaId, tokenA);
  check(
    "Evaluate version 2 -> 201",
    evaluateV2.status === 201 &&
      evaluateV2.data.reviews.length === 3,
    "status " + evaluateV2.status
  );

  const allReviews = await request("GET", BASE + "/ideas/" + ideaId + "/reviews");
  check(
    "6 reviews total (3 for v1 + 3 for v2)",
    allReviews.status === 200 && allReviews.data.count === 6,
    "count " + (allReviews.data && allReviews.data.count)
  );

  // --- Leaderboard ---------------------------------------------
  console.log("\nLeaderboard");
  const board = await request("GET", BASE + "/leaderboard");
  const row =
    board.data && board.data.leaderboard
      ? board.data.leaderboard.find((entry) => entry.ideaId === ideaId)
      : null;

  check("GET /leaderboard -> 200", board.status === 200, "status " + board.status);
  check("Our idea is ranked", Boolean(row));
  check(
    "AI score is a positive average",
    row && row.aiScore > 0 && row.aiScore <= 10,
    row && String(row.aiScore)
  );
  check(
    "Vote count is 1",
    row && row.voteCount === 1,
    row && String(row.voteCount)
  );
  // The vote part of the formula is NORMALIZED against the most-voted
  // idea, so the expected value has to be worked out from the board
  // itself. The database may already contain ideas from earlier runs.
  const allRows = board.data && board.data.leaderboard ? board.data.leaderboard : [];
  let maxVotes = 0;

  for (const entry of allRows) {
    if (entry.voteCount > maxVotes) {
      maxVotes = entry.voteCount;
    }
  }

  const expectedVoteScore = maxVotes > 0 ? (row.voteCount / maxVotes) * 10 : 0;
  const expectedFinal = Math.round((0.7 * row.aiScore + 0.3 * expectedVoteScore) * 100) / 100;

  check(
    "finalScore = 0.7*aiScore + 0.3*voteScore (rounded)",
    row && Math.abs(row.finalScore - expectedFinal) < 0.02,
    row && "got " + row.finalScore + ", expected " + expectedFinal
  );

  // The rank must match the position of our row in the sorted board.
  const expectedRank = allRows.findIndex((entry) => entry.ideaId === ideaId) + 1;
  check(
    "Rank matches the board order",
    row && row.rank === expectedRank,
    row && "got " + row.rank + ", expected " + expectedRank
  );

  // The board itself must be sorted from the highest final score down.
  let sortedCorrectly = true;

  for (let i = 1; i < allRows.length; i++) {
    if (allRows[i - 1].finalScore < allRows[i].finalScore) {
      sortedCorrectly = false;
    }
  }

  check("Board is sorted by final score (highest first)", sortedCorrectly);

  // --- 404 ------------------------------------------------------
  console.log("\nErrors");
  const notFound = await request("GET", BASE + "/no-such-route");
  check("Unknown API route -> 404", notFound.status === 404, "status " + notFound.status);

  // --- Summary --------------------------------------------------
  console.log("\n=== Result: " + passed + " passed, " + failed + " failed ===");

  if (failed > 0) {
    process.exit(1);
  }

  // Leave the test data in place for the owner's browser walkthrough:
  //   founder account (USER_A), voter account (USER_B), 1 idea,
  //   6 AI reviews, 1 vote. Emails are listed in the final report.
  process.exit(0);
}

main();
