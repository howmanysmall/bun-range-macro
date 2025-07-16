declare global {
	/**
	 * Used to do a numeric iterator over a range of numbers cleaner than the
	 * standard method in TypeScript. This is a macro and will not have any
	 * performance cost at runtime.
	 *
	 * The `step` argument controls the amount incremented per loop. It defaults
	 * to `1`.
	 *
	 * Both of these for loops are functionally equivalent:.
	 *
	 * ```ts
	 * for (let index = 1; index <= 10; index += 1) console.log(index);
	 * for (const index of range(1, 10)) console.log(index);
	 * ```
	 *
	 * As are these two:
	 *
	 * ```ts
	 * for (let index = 10; index >= 1; index -= 1) console.log(index);
	 * for (const index of range(10, 1, -1)) console.log(index);
	 * ```
	 *
	 * @param startIndex - The starting index of the range.
	 * @param finishIndex - The ending index of the range (inclusive).
	 * @param step - The amount to increment each iteration.
	 * @returns An iterable of numbers from `startIndex` to `finishIndex`
	 *   inclusive.
	 */
	export function $range(startIndex: number, finishIndex: number, step?: number): Iterable<number>;
}

const ONLY_ECMA_SCRIPT_REGEX = /\.(ts|tsx|js|jsx)$/;
const FOR_LOOP_REGEX = /for\s*\(\s*const\s+([a-zA-Z0-9_]+)\s+of\s+\$range\s*\(([^,]+),([^,)]+)(?:,\s*([^)]+))?\)\)/g;

/**
 * What this plugin does is quite simple. It parses over TypeScript source code
 * and replaces any `$range` macros with an equivalent for loop.
 *
 * So given the following code:.
 *
 * ```typescript
 * const array = new Array<number>(10);
 * for (const index of $range(0, 9)) array[index] = index;
 * ```
 *
 * It will be transformed to:
 *
 * ```typescript
 * const array = new Array<number>(10);
 * for (let index = 0; index <= 9; index += 1) array[index] = index;
 * ```
 *
 * The documentation for the `$range` macro is available at {@linkcode $range}.
 */
const rangeMacroPlugin: Bun.BunPlugin = {
	name: "$range macro plugin",
	setup(build: Bun.PluginBuilder): void {
		build.onLoad({ filter: ONLY_ECMA_SCRIPT_REGEX }, async ({ loader, path }): Promise<Bun.OnLoadResult> => {
			const code = await Bun.file(path).text();
			const contents = code.replace(
				FOR_LOOP_REGEX,
				// eslint-disable-next-line better-max-params/better-max-params -- useless error
				(_: string, variableName: string, start: string, finish: string, step?: string): string => {
					const increment = step ? step.trim() : "1";
					if (increment === "0") throw new TypeError(`$range macro step cannot be zero in ${path}`);

					const startIndex = start.trim();
					const finishIndex = finish.trim();
					const comparison = increment.startsWith("-") ? ">=" : "<=";
					return `for (let ${variableName} = ${startIndex}; ${variableName} ${comparison} ${finishIndex}; ${variableName} += ${increment})`;
				},
			);
			return { contents, loader };
		});
	},
};

export default rangeMacroPlugin;
