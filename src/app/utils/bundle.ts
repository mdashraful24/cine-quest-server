export type BundleSelection = {
	size: number;
	quantity: number;
};

export type BookingQuote = {
	possible: boolean;
	groupSize: number;
	totalBundles: number;
	bundles: BundleSelection[];
	message?: string;
};

export const calculateBookingQuote = (
	groupSize: number,
	bundleSizes: number[],
): BookingQuote => {
	const sizes = [...new Set(bundleSizes)].sort((a, b) => b - a);
	const best: Array<{ count: number; sizes: number[] } | null> = Array.from(
		{ length: groupSize + 1 },
		() => null,
	);

	best[0] = { count: 0, sizes: [] };

	for (let amount = 1; amount <= groupSize; amount += 1) {
		for (const size of sizes) {
			if (size > amount) continue;

			const previous = best[amount - size];
			if (!previous) continue;

			const count = previous.count + 1;
			const current = best[amount];

			if (!current || count < current.count) {
				best[amount] = { count, sizes: [...previous.sizes, size] };
			}
		}
	}

	const solution = best[groupSize];

	if (!solution) {
		return {
			possible: false,
			groupSize,
			totalBundles: 0,
			bundles: [],
			message: "No exact bundle combination is possible for this group size.",
		};
	}

	const quantities = new Map<number, number>();

	for (const size of solution.sizes) {
		quantities.set(size, (quantities.get(size) ?? 0) + 1);
	}

	const bundles = [...quantities.entries()]
		.map(([size, quantity]) => ({ size, quantity }))
		.sort((a, b) => b.size - a.size);

	return {
		possible: true,
		groupSize,
		totalBundles: solution.count,
		bundles,
	};
};
