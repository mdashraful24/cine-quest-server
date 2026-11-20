# AI Tool Usage — Doomsday Ready Server

This file discloses AI tool usage in this repository, as required by the assessment brief.

AI tool used: `opencode` CLI.

## How AI was used

1. Read the server source tree, Prisma schema, migrations, seed files, tests, package manifest, env template, README, and API integration guide.
2. Compared the movie/rewatch and cinema/booking requirements with the assessment brief.
3. Identified documentation inconsistencies, including the demo cinema count, environment-validation wording, and the file responsible for middleware wiring.
4. Drafted and reviewed README corrections, AI-usage documentation, and local verification instructions.
5. Ran the project's own typecheck, test, formatter, linter, and build scripts to validate the final state.

Prompts used included:

```text
Analyze the server project, list the exact API contracts, validation rules, setup commands,
environment variables, and documentation inconsistencies, with file paths and line numbers.
```

```text
Compare the server with the assessment PDF and identify missing README/setup/AI-usage items.
```

## What was not delegated

- The Feature 1 logic in `src/app/utils/graph.ts` and the Feature 2 logic in `src/app/utils/bundle.ts` were not replaced or rewritten by AI.
- No external graph solver, scheduler, or bundle-solving library was added.
- No runtime AI dependency, API key, secret, or deployment account was generated.
- The final documentation and command outputs were reviewed against the source code.

## Files produced or revised

- `README.md` — setup, API reference, scripts, data model, assumptions, deployment, and AI-usage summary.
- `AI_USAGE.md` — this detailed record.

## Verification

```bash
bun run typecheck
bun run test
bun run format:check
bun run lint:check
bun run build
```

Result: all checks passed; the server test suite ran 9 tests across 3 suites with 0 failures.
