import test from "node:test";
import assert from "node:assert/strict";
import { parseBuildRequest } from "../src/generator/requestParser.js";

test("parses budget, goal, and implied tags", () => {
  const request = parseBuildRequest("fire ignite spell starter balanced");

  assert.equal(request.budget, "starter");
  assert.equal(request.goal, "balanced");
  assert.ok(request.tags.includes("fire"));
  assert.ok(request.tags.includes("ignite"));
  assert.ok(request.tags.includes("spell"));
  assert.ok(request.tags.includes("ailment_magnitude"));
});

