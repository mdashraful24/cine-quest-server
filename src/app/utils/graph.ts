export type PrerequisiteEdge = {
	movieId: string;
	prerequisiteId: string;
};

export type Adjacency = Map<string, string[]>;

export const buildAdjacency = (edges: PrerequisiteEdge[]): Adjacency => {
	const adjacency: Adjacency = new Map();

	for (const edge of edges) {
		const prerequisites = adjacency.get(edge.movieId) ?? [];
		prerequisites.push(edge.prerequisiteId);
		adjacency.set(edge.movieId, prerequisites);
	}

	return adjacency;
};

export const canReach = (
	start: string,
	target: string,
	adjacency: Adjacency,
) => {
	if (start === target) return true;

	const visited = new Set<string>([start]);
	const stack = [start];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;

		for (const next of adjacency.get(current) ?? []) {
			if (next === target) return true;

			if (!visited.has(next)) {
				visited.add(next);
				stack.push(next);
			}
		}
	}

	return false;
};

export const wouldCreateCycle = (
	movieId: string,
	prerequisiteIds: string[],
	adjacency: Adjacency,
) =>
	prerequisiteIds.some((prerequisiteId) =>
		canReach(prerequisiteId, movieId, adjacency),
	);

export const getRewatchOrder = (
	targetId: string,
	edges: PrerequisiteEdge[],
) => {
	const adjacency = buildAdjacency(edges);
	const ordered: string[] = [];
	const visited = new Set<string>();
	const visiting = new Set<string>();

	const visit = (movieId: string) => {
		if (visited.has(movieId) || visiting.has(movieId)) return;

		visiting.add(movieId);

		for (const prerequisiteId of adjacency.get(movieId) ?? []) {
			visit(prerequisiteId);
		}

		visiting.delete(movieId);
		visited.add(movieId);
		ordered.push(movieId);
	};

	for (const prerequisiteId of adjacency.get(targetId) ?? []) {
		visit(prerequisiteId);
	}

	return ordered;
};
