import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBookingQuote } from "./bundle";

describe("calculateBookingQuote", () => {
	it("uses the fewest exact bundles", () => {
		assert.deepEqual(calculateBookingQuote(6, [1, 3, 4]), {
			possible: true,
			groupSize: 6,
			totalBundles: 2,
			bundles: [{ size: 3, quantity: 2 }],
		});
	});

	it("combines larger and smaller bundles", () => {
		assert.deepEqual(calculateBookingQuote(11, [2, 5]), {
			possible: true,
			groupSize: 11,
			totalBundles: 4,
			bundles: [
				{ size: 5, quantity: 1 },
				{ size: 2, quantity: 3 },
			],
		});
	});

	it("handles three distinct bundle sizes", () => {
		assert.deepEqual(calculateBookingQuote(44, [6, 9, 20]), {
			possible: true,
			groupSize: 44,
			totalBundles: 4,
			bundles: [
				{ size: 20, quantity: 1 },
				{ size: 9, quantity: 2 },
				{ size: 6, quantity: 1 },
			],
		});
	});

	it("reports impossible exact sums", () => {
		const quote = calculateBookingQuote(7, [4, 6]);

		assert.equal(quote.possible, false);
		assert.equal(quote.totalBundles, 0);
		assert.deepEqual(quote.bundles, []);
		assert.match(quote.message ?? "", /exact bundle combination/i);
	});
});
