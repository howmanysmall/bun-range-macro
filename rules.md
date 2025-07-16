# Codebase Rules

## Bun Specifics

- Prefer Bun-specific APIs and features when possible.
- If a Node.js API is not available in Bun, suggest a Bun alternative or workaround.
- Always provide clear, concise, and idiomatic TypeScript code.
- Explain any Bun-specific commands or configuration if used.
- Use `bun`, not `npm`, `pnpm`, or `yarn`.
- Node libraries may not be available, but generally are.
- Use `bun add` to install dependencies.
- Use `bun run` to run scripts.
- Prefer Bun’s built-in test runner: write tests in `*.test.ts` and run them with `bun test`.
- Demonstrate file watching with `bun run --watch` for rapid development.
- Show examples using Bun’s native APIs (e.g. `Bun.serve`, `Bun.file`, `Bun.spawn`) before falling back to Node-compat shims.
- If using environment variables, illustrate loading them via `import.meta.env`.
- For bundling, highlight `bun build --target <platform>` and its options.
- When relevant, show how to leverage Bun’s SQLite integration (`import { DB } from "bun:sqlite"`).
- Use `Bun.file` for file operations instead of `fs` when possible.
- Use `Bun.serve` for HTTP servers instead of `http` or `https`.
- Use `Bun.spawn` for child processes instead of `child_process`.
- Use `Bun.env` for environment variables instead of `process.env`.
- Use `Bun.fetch` for HTTP requests instead of `node-fetch` or `axios`.
- Use `Bun.write` for file writing instead of `fs.writeFile`.
- Install Bun’s TypeScript definitions by running `bun add -d @types/bun` and include `"types": ["bun-types"]` in your `tsconfig.json` to avoid editor errors.
- Leverage Bun’s runtime support for `compilerOptions.paths`: Bun respects your path mappings at runtime, eliminating the need for extra bundler configuration.
- Centralize project configuration in `bunfig.toml`, defining scripts, registry settings (`[install.registry]`), and test options in one place.
- Use `import.meta.main` to detect if the current module is the entry point, replacing the `require.main === module` pattern.
- Build standalone executables with `bun build --compile --target=<platform>` (e.g. `bun build --compile --target=bun-linux-x64 ./src/index.ts --outfile myapp`).
- Configure Bun’s test runner via the `[test]` section in `bunfig.toml` to set timeouts, roots, and coverage thresholds.
- Use `bun --hot` during development for in-process hot-reload without a full restart; pair it with test runs (`bun test --hot`) for instant feedback.
- Serve static assets with a one-liner: `Bun.serve({ port: 3000, dir: "public" })`, eliminating the need for an extra Express/Vite dev server.
- For quick, editor-style type-checks, run `bunx tsc --noEmit` (or `bunx tsc -b --incremental` in monorepos) to leverage Bun’s download-free package runner.

## General TypeScript

- Use ESM-style imports/exports and avoid CommonJS.
- Do not use `any` type; prefer specific types or `unknown` (or `never`) when necessary.
- Use JSDoc comments on exported functions/types.
- Define consistent naming conventions: `PascalCase` for types/interfaces, `camelCase` for functions, `SCREAMING_SNAKE_CASE` for constants.
- Use `const` for constants and `let` for variables that may change.
- Use `async/await` for asynchronous code.
- Use `Promise` for asynchronous functions.
- Use `type` for type aliases and `interface` for interfaces.
- Use `enum` for enumerations.
- Use `import type` for type-only imports.
- Use `export type` for type exports.
- Use `export default` for default exports when appropriate.
- Use `import.meta` for module metadata.
- Use `import.meta.env` for environment variables.
- Use `import.meta.url` for the current module URL.
- Use `import.meta.resolve` for resolving module paths.
- Enable strict compiler options in your tsconfig (strict, strictNullChecks, noImplicitAny, noUnusedLocals, noUnusedParameters, noImplicitReturns, noFallthroughCasesInSwitch).
- Explicitly annotate return types on all exported functions (even if TS can infer them) to keep your public API clear.
- Favor immutability: use `readonly` on object properties, `Readonly<T>` for arrays, and `as const` for literal tuples.
- Do not use `X[]` for arrays, use `Array<X>` instead for consistency and to avoid confusion with tuple types.
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of manual existence checks.
- Model complex states with discriminated unions and exhaustive `switch`–cases, using a `never` default branch to catch unhandled variants.
- Leverage utility types (`Partial`, `Required`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, etc.) to DRY up and evolve types safely.
- Prefer `unknown` over `any` for untyped inputs and write type-guard functions (e.g. `isFoo(x): x is Foo`) to narrow them.
- Define and use path aliases in tsconfig (`baseUrl` + `paths`) for clearer, non-fragile imports.
- Limit use of `as` casts and `// @ts-ignore`/`// @ts-expect-error`; strive to codify correct types instead of silencing errors.
- Integrate ESLint (with `@typescript-eslint`) and Prettier into your editor and CI to enforce consistent style and catch subtle bugs.
- Document complex types and public APIs with TSDoc (`/** … */`) so editors can surf your docs inline.
- When a function accepts multiple or optional parameters, prefer a single `options: { … }` object over long parameter lists.
- Use default parameter values (`function fn(x = 42)`) to avoid accidental `undefined` propagation.
- Avoid internal `namespace` blocks—favor ES modules and per-file exports instead.
- Group imports into logical sections (external modules, path-aliases, relative imports), separated by blank lines for readability.
- Use top-level `await` (in ESM files) sparingly for initialization scripts or REPL-style code, knowing Bun and modern bundlers support it.
- Enable `noUncheckedIndexedAccess` in `tsconfig.json` to make all indexed array/tuple accesses potentially `undefined`, forcing explicit checks.
- Turn on `exactOptionalPropertyTypes` to distinguish between truly absent properties and those explicitly set to `undefined`.
- Use `strictFunctionTypes` for contravariant checking of function parameters, preventing unsafe assignments of functions with incompatible signatures.
- Employ branded (nominal) types, e.g. `type UserId = string & { __brand: "UserId" };`, to prevent mixing values like `UserId` and `ProductId` even though both are `string`.
- Enable incremental builds and composite project references in `tsconfig.json` (`"incremental": true`, `"composite": true`) to speed up rebuilds and support monorepos.
- Enable `strictBindCallApply` in your `tsconfig.json` to enforce correct signatures when using `.bind`, `.call`, and `.apply`.
- Turn on `noImplicitOverride` so that any class member overriding a base method must be marked with the `override` keyword.
- Enable `noImplicitThis` to catch invalid or unexpected `this` usages in functions and methods.
- Use `noPropertyAccessFromIndexSignature` to prevent accidental dynamic property access that bypasses your index‐signature types.
- Enable `noUnnecessaryTypeAssertion` and `noUnusedTypeParameters` to catch redundant `as` casts and unused generic type parameters.
- Do not EVER use null.
- Leverage TS 4.9’s `satisfies` operator when declaring object literals to validate against interfaces without widening literal types:

	```ts
	const config = {
		host: "localhost",
		port: 8080,
	} satisfies ServerConfig;
	```

- Write user‐defined type‐guard functions with `asserts` signatures for runtime checks and compile‐time narrowing:

	```typescript
	function assertFoo(x: unknown): asserts x is Foo {
		if (!isFoo(x)) throw new Error("Not a Foo");
	}
	```

- Use template literal types and conditional/mapped types to express complex string patterns and transforms in your public APIs.
- Prefer `ReadonlyMap<K, V>` and `ReadonlySet<T>` (or `Readonly<Record<K, V>>`) for collections you don’t intend to mutate.
- Mark deprecated APIs with the `@deprecated` TSDoc tag to signal upcoming removals or replacements in editor tooltips and docs.
- Integrate a schema‐validation library (e.g. Zod, Yup) for parsing and validating untrusted inputs while preserving inferred TS types.
- Define and enforce import ordering and grouping via ESLint (`sort-imports` or similar) to keep external, alias, and relative imports well organized.
- Use project references (`"composite": true`) in `tsconfig.json` to split large codebases or monorepos into faster incremental build units.
- Pin your Bun version in `package.json`’s `engines.bun` field and check it at runtime via `import.meta.bunVersion` to ensure consistent environments.
- Leverage Bun’s `import.meta.glob`/`globEager` (when available) for filesystem‐based code loading or route registration without additional dependencies.
- Do not import files with `require`, `import * as x from "./x.ts"`, or `import * as x from "./x.js"`; always use `import * as x from "./x"`.
- File names are `kebab-case`, always. Do not stray from this.
- Use biome for linting and formatting.
- Always prefer `export default` for primary exports.
- Do not ever use `console.*`, use the `logger` equivalent from the logger library.
- If a block can be on a single line, it should be a single line. What I mean by this is you do not need to include braces.
- You must always declare class modifiers. Do not ever miss these.
- Async functions always have async in the name - like what Roblox does. `async function getCoolGuy()` should be `async function getCoolGuyAsync()`. On the contrary, if the function isn't async, it does not end with sync.

## Advanced TypeScript

- Enable `"exactOptionalPropertyTypes": true` to distinguish between a missing property and one explicitly set to `undefined`, preventing subtle runtime bugs.
- Turn on `"noPropertyAccessFromIndexSignature": true` so accidental typos like `user.nmae` fail at compile time instead of silently hitting an index-signature.
- Adopt the **`satisfies`** operator to ensure a value conforms to an interface while keeping its literal types (e.g., `const colors = {...} satisfies Record<ColorName, string>`).
- Prefer `"useUnknownInCatchVariables": true` (or `catch (e: unknown)`) so you must narrow caught errors before you can inspect them.
- Write assertion functions with `asserts` return types—e.g.,
	`function assertFoo(x: unknown): asserts x is Foo { /* runtime check */ }`—to combine validation and type-narrowing.
- Add `function assertNever(x: never): never { throw new Error("Unhandled case"); }` in default branches to guarantee exhaustive discriminated-union handling.
- Use template-literal types to model string invariants, e.g., `type Hex = \`0x${string}\`` or `type Brand<T, B> = T & { __brand: B }`.
- Set `"moduleResolution": "bundler"` (with `"module": "es2020"`) so TypeScript resolves imports exactly as Bun or Vite would, avoiding extension-related false errors.
- In multi-package repos, enable `"incremental": true` and `"composite": true`, then invoke `tsc -b` for fast, dependency-aware builds; add `bunx tsc -w -b` to your dev script for live type-checking.
