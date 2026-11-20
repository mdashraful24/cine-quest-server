import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildAdjacency,
	getRewatchOrder,
	wouldCreateCycle,
	type PrerequisiteEdge,
} from "./graph";

const edges: PrerequisiteEdge[] = [
	{ movieId: "avengers", prerequisiteId: "ironman" },
	{ movieId: "avengers", prerequisiteId: "captain" },
	{ movieId: "civilwar", prerequisiteId: "avengers" },
	{ movieId: "infinity", prerequisiteId: "civilwar" },
	{ movieId: "infinity", prerequisiteId: "ragnarok" },
	{ movieId: "endgame", prerequisiteId: "infinity" },
	{ movieId: "doomsday", prerequisiteId: "endgame" },
];

describe("getRewatchOrder", () => {
	it("returns every prerequisite once in a valid order", () => {
		const order = getRewatchOrder("doomsday", edges);

		assert.equal(order.length, 7);
		assert.equal(new Set(order).size, 7);
		assert.equal(order.includes("doomsday"), false);

		for (const edge of edges) {
			const movieIndex = order.indexOf(edge.movieId);
			const prerequisiteIndex = order.indexOf(edge.prerequisiteId);

			if (movieIndex !== -1 && prerequisiteIndex !== -1) {
				assert.ok(prerequisiteIndex < movieIndex);
			}
		}
	});

	it("returns an empty list for a movie with no prerequisites", () => {
		assert.deepEqual(getRewatchOrder("ragnarok", edges), []);
	});
});

describe("wouldCreateCycle", () => {
	it("rejects indirect cycles", () => {
		assert.equal(
			wouldCreateCycle("ironman", ["endgame"], buildAdjacency(edges)),
			true,
		);
	});

	it("rejects self dependencies", () => {
		assert.equal(
			wouldCreateCycle("ironman", ["ironman"], buildAdjacency(edges)),
			true,
		);
	});

	it("allows independent movies", () => {
		assert.equal(
			wouldCreateCycle("ragnarok", ["ironman"], buildAdjacency(edges)),
			false,
		);
	});
});
