#!/usr/bin/env bun

/* eslint-disable sonar/no-duplicate-string -- useless and annoying */
/* eslint-disable max-lines -- useless */
/* eslint-disable max-depth -- annoying */
/* eslint-disable max-lines-per-function -- worthless in this context */

import { join } from "node:path";

const QUOTED_STRING_REGEX = /^(['"])(.*)\1$/;
const BOOLEAN_REGEX = /^(?:true|false)$/;
const INTEGER_REGEX = /^[+-]?\d+$/;
const FLOAT_REGEX = /^[+-]?\d+\.\d+$/;

function trim(value: string): string {
	return value.trim();
}
function filterEmpty(value: string): boolean {
	return value.length > 0;
}
function isQuoted(value: string): boolean {
	return QUOTED_STRING_REGEX.test(value);
}
function parseNumber(value: string): number {
	return INTEGER_REGEX.test(value) ? Number.parseInt(value, 10) : Number.parseFloat(value);
}

/**
 * Bun configuration schema for `bunfig.toml`. See
 * https://bun.sh/docs/runtime/bunfig.
 */
interface BunConfiguration {
	/** Any other custom fields are permitted. */
	[key: string]: unknown;

	/**
	 * Replace global identifiers with constant expressions. Bun will inline
	 * these everywhere.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#define
	 */
	define?: Record<string, string>;

	/**
	 * Package‐manager (“bun install”) options.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#package-manager
	 */
	install?: InstallConfiguration;

	/**
	 * Configure how Bun handles JSX.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#jsx
	 * @see https://www.typescriptlang.org/tsconfig/#jsx
	 */
	jsx?: string;

	/**
	 * Specify the function that is used to create JSX elements.
	 *
	 * @see https://www.typescriptlang.org/tsconfig#jsxFactory
	 */
	jsxFactory?: string;

	/**
	 * Specify the function that is used for JSX fragments.
	 *
	 * @see https://www.typescriptlang.org/tsconfig#jsxFragment
	 */
	jsxFragment?: string;

	/**
	 * Specify the module specifier to be used for importing the JSX factory
	 * functions.
	 *
	 * @see https://www.typescriptlang.org/tsconfig#jsxImportSource
	 */
	jsxImportSource?: string;

	/**
	 * Configure how Bun maps file extensions to loaders.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#loader
	 */
	loader?: Record<string, Loader>;

	/**
	 * Set the log level. Can be one of `"debug"`, `"warn"`, or `"error"`.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#loglevel
	 */
	logLevel?: LogLevel;

	/**
	 * An array or string of scripts/plugins to run before running the file or
	 * script.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#preload
	 */
	preload?: Array<string> | string;

	/**
	 * `bun run` options.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#bun-run
	 */
	run?: RunConfiguration;

	/**
	 * Enable `smol` mode. This reduces memory usage at the cost of performance.
	 *
	 * @default false
	 * @see https://bun.sh/docs/runtime/bunfig#smol
	 */
	smol?: boolean;

	/**
	 * Enable or disable Bun’s telemetry.
	 *
	 * @default true
	 * @see https://bun.sh/docs/runtime/bunfig#telemetry
	 */
	telemetry?: boolean;

	/**
	 * Test runner options.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-runner
	 */
	test?: TestConfiguration;
}

/**
 * Log level for Bun output. Determines the verbosity of logs.
 *
 * - "debug": Detailed debug information.
 * - "error": Only error messages.
 * - "warn": Warnings and errors.
 */
type LogLevel = "debug" | "error" | "warn";

/** Valid values for `loader[...]`. */
type Loader =
	| "base64"
	| "css"
	| "dataurl"
	| "file"
	| "js"
	| "json"
	| "jsx"
	| "napi"
	| "text"
	| "toml"
	| "ts"
	| "tsx"
	| "wasm";

/**
 * Options under the `[test]` section.
 *
 * @see https://bun.sh/docs/runtime/bunfig#test-runner
 */
interface TestConfiguration {
	/**
	 * Enable coverage reporting.
	 *
	 * @default false
	 * @see https://bun.sh/docs/runtime/bunfig#test-coverage
	 */
	coverage?: boolean;

	/**
	 * Directory in which to write persistent coverage reports. Default:
	 * `"coverage"`.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-coveragedir
	 */
	coverageDir?: string;

	/**
	 * Coverage reporters to run. Default: `["text"]`.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-coveragereporter
	 */
	coverageReporter?: Array<CoverageReporter>;

	/**
	 * Skip test files when computing coverage. Default: `false`.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-coverageskiptestfiles
	 */
	coverageSkipTestFiles?: boolean;

	/**
	 * Coverage threshold: a single number or per‐metric map.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-coveragethreshold
	 */
	coverageThreshold?: number | Record<string, number>;

	/**
	 * Same as top‐level `preload`, but only for `bun test`.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-preload
	 */
	preload?: Array<string> | string;

	/**
	 * The root directory to run tests from. Default: `"."`.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#test-root
	 */
	root?: string;

	/**
	 * Same as top‐level `smol`, but only for `bun test`.
	 *
	 * @default false
	 * @see https://bun.sh/docs/runtime/bunfig#test-smol
	 */
	smol?: boolean;
}

/**
 * Specifies the format of coverage reports generated by the test runner.
 *
 * - "lcov": Generates an LCOV coverage report.
 * - "text": Generates a plain text coverage report.
 */
type CoverageReporter = "lcov" | "text";

/**
 * Options under the `[install]` section.
 *
 * @see https://bun.sh/docs/runtime/bunfig#package-manager
 */
interface InstallConfiguration {
	/**
	 * @default "auto"
	 * @see https://bun.sh/docs/runtime/bunfig#install-auto
	 */
	auto?: AutoInstall;

	/** CA certificate as a string. */
	ca?: string;

	/**
	 * Cache settings.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#install-cache
	 */
	cache?: {
		/**
		 * Directory to use for cache.
		 *
		 * @default "~/.bun/install/cache"
		 */
		dir?: string;

		/**
		 * Skip loading from global cache.
		 *
		 * @default false
		 */
		disable?: boolean;

		/**
		 * Always resolve latest from registry.
		 *
		 * @default false
		 */
		disableManifest?: boolean;
	};

	/** Path to a CA file containing one or more certs. */
	cafile?: string;

	/** @default true */
	dev?: boolean;

	/** @default false */
	dryRun?: boolean;

	/** @default false */
	exact?: boolean;

	/** @default false */
	frozenLockfile?: boolean;

	/**
	 * Directory for globally‐installed binaries.
	 *
	 * @default "~/.bun/bin"
	 */
	globalBinDir?: string;

	/**
	 * Directory for globally‐installed packages.
	 *
	 * @default "~/.bun/install/global"
	 */
	globalDir?: string;

	/**
	 * Lockfile behavior.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#install-lockfile
	 */
	lockfile?: {
		/** Generate alongside `bun.lock`. Currently only `"yarn"`. */
		print?: "yarn";
		/**
		 * Generate a lockfile on install.
		 *
		 * @default true
		 */
		save?: boolean;
	};

	/** @default true */
	optional?: boolean;

	/** @default true */
	peer?: boolean;

	/** @default false */
	production?: boolean;

	/**
	 * Registry URL or detailed config.
	 *
	 * @default "https://registry.npmjs.org/"
	 * @see https://bun.sh/docs/runtime/bunfig#install-registry
	 */
	registry?: string | { token?: string; url: string };

	/** @default true */
	saveTextLockfile?: boolean;

	/**
	 * Per-scope registry overrides.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#install-scopes
	 */
	scopes?: Record<string, string | { password?: string; token?: string; url: string; username?: string }>;
}

/** The automatic installation configuration. */
type AutoInstall = "auto" | "disable" | "fallback" | "force";

/**
 * Options under the `[run]` section.
 *
 * @see https://bun.sh/docs/runtime/bunfig#bun-run
 */
interface RunConfiguration {
	/**
	 * When true, auto-alias `node` → `bun` in `bun run`.
	 *
	 * @default false
	 * @see https://bun.sh/docs/runtime/bunfig#run-bun-auto-alias-node-to-bun
	 */
	bun?: boolean;

	/**
	 * Which shell to use for scripts.
	 *
	 * @see https://bun.sh/docs/runtime/bunfig#run-shell-use-the-system-shell-or-bun-s-shell
	 */
	shell?: "bun" | "system";

	/**
	 * Suppress the command output itself.
	 *
	 * @default false
	 * @see https://bun.sh/docs/runtime/bunfig#run-silent-suppress-reporting-the-command-being-run
	 */
	silent?: boolean;
}

function parseToml(content: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	let current: Record<string, unknown> = result;
	const lines = content.split(/\r?\n/);

	let index = 0;
	for (const raw of lines) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) {
			index += 1;
			continue;
		}

		if (line.startsWith("[") && line.endsWith("]")) {
			const headerName = line.slice(1, -1).trim();
			if (!headerName) throw new Error(`Invalid table header at line ${index + 1}`);

			const parts = headerName.split(".").map(trim);
			current = result;
			for (const part of parts) {
				if (!current[part] || typeof current[part] !== "object") current[part] = {};
				current = current[part] as Record<string, unknown>;
			}
			index += 1;
			continue;
		}

		const equalsIndex = line.indexOf("=");
		if (equalsIndex === -1) throw new Error(`Invalid line (no '=') at line ${index + 1}`);

		const rawKey = line.slice(0, equalsIndex).trim();
		const keyParts = rawKey.split(".").map(trim);
		let rawValue = line.slice(equalsIndex + 1).trim();

		if (!rawValue.startsWith('"') && !rawValue.startsWith("'")) {
			const commentIndex = rawValue.indexOf("#");
			if (commentIndex !== -1) rawValue = rawValue.slice(0, commentIndex).trim();
		}

		let value: unknown;
		if (isQuoted(rawValue)) value = rawValue.slice(1, -1);
		else if (BOOLEAN_REGEX.test(rawValue)) value = rawValue === "true";
		else if (INTEGER_REGEX.test(rawValue) || FLOAT_REGEX.test(rawValue)) value = parseNumber(rawValue);
		else if (rawValue.startsWith("{") && rawValue.endsWith("}")) {
			const inner = rawValue.slice(1, -1).trim();
			const internalObject: Record<string, unknown> = {};
			if (inner) {
				const entries = inner.split(",").map(trim).filter(filterEmpty);
				for (const entry of entries) {
					const equalIndex = entry.indexOf("=");
					if (equalIndex === -1)
						throw new Error(`Invalid inline table entry '${entry}' at line ${index + 1}`);

					let key = entry.slice(0, equalIndex).trim();
					if (isQuoted(key)) key = key.slice(1, -1);

					const valueRaw = entry.slice(equalIndex + 1).trim();
					if (isQuoted(valueRaw)) internalObject[key] = valueRaw.slice(1, -1);
					else if (BOOLEAN_REGEX.test(valueRaw)) internalObject[key] = valueRaw === "true";
					else if (INTEGER_REGEX.test(valueRaw) || FLOAT_REGEX.test(valueRaw))
						internalObject[key] = parseNumber(valueRaw);
					else if (valueRaw.startsWith("[") && valueRaw.endsWith("]")) {
						const arrayItems = valueRaw.slice(1, -1).split(",").map(trim).filter(filterEmpty);
						internalObject[key] = arrayItems.map((item: string) => {
							if (isQuoted(item)) return item.slice(1, -1);
							if (BOOLEAN_REGEX.test(item)) return item === "true";
							if (INTEGER_REGEX.test(item) || FLOAT_REGEX.test(item)) return parseNumber(item);
							throw new Error(`Invalid array item '${item}' in inline table at line ${index + 1}`);
						});
					} else throw new Error(`Unsupported inline table value '${valueRaw}' at line ${index + 1}`);
				}
			}
			value = internalObject;
		} else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			const items = rawValue.slice(1, -1).split(",").map(trim).filter(filterEmpty);
			value = items.map((item: string) => {
				if (isQuoted(item)) return item.slice(1, -1);
				if (BOOLEAN_REGEX.test(item)) return item === "true";
				if (INTEGER_REGEX.test(item) || FLOAT_REGEX.test(item)) return parseNumber(item);
				throw new Error(`Invalid array item '${item}' at line ${index + 1}`);
			});
		} else throw new Error(`Unsupported value '${rawValue}' at line ${index + 1}`);

		let target = current;
		for (let jndex = 0; jndex < keyParts.length - 1; jndex += 1) {
			const part = keyParts[jndex];
			if (!part) continue;
			if (!target[part] || typeof target[part] !== "object") target[part] = {};
			target = target[part] as Record<string, unknown>;
		}

		const lastKey = keyParts[keyParts.length - 1];
		if (lastKey) target[lastKey] = value;
		index += 1;
	}

	return result;
}

function errorToString(value: unknown): string {
	return value instanceof Error ? value.message : String(value);
}

/**
 * Reads and parses a bunfig TOML file.
 *
 * @param filePath - Path to the bunfig.toml file.
 * @returns Parsed configuration object.
 * @throws Error if the file is missing or invalid.
 */
async function readBunConfigurationAsync(filePath: string): Promise<BunConfiguration> {
	const file = Bun.file(filePath);
	const exists = await file.exists();
	if (!exists) throw new Error(`bunfig file not found: ${filePath}`);

	let content: string;
	try {
		content = await file.text();
	} catch (error: unknown) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT")
			throw new Error(`bunfig file not found: ${filePath}`);
		throw error;
	}

	try {
		return parseToml(content);
	} catch (error: unknown) {
		throw new Error(`Failed to parse bunfig file: ${errorToString(error)}`);
	}
}

function serializeValue(value: unknown): string {
	if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`;
	if (typeof value === "boolean" || typeof value === "number") return String(value);
	if (Array.isArray(value)) {
		const items = value.map(serializeValue).join(", ");
		return `[${items}]`;
	}
	throw new Error(`Cannot serialize value: ${value}`);
}

interface TableEntry {
	readonly key: string;
	readonly value: object;
}
function isNested([, value]: [string, unknown]): boolean {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Recursively serialize a JS object into a TOML string.
 *
 * @param object - The object to serialize.
 * @param parentKey - Parent key path used for nested tables.
 * @returns The serialized TOML string.
 */
function serializeToml(object: object, parentKey = ""): string {
	const lines = new Array<string>();
	let linesLength = 0;

	const tables = new Array<TableEntry>();
	let tablesLength = 0;

	for (const [key, value] of Object.entries(object)) {
		const fullKey = parentKey ? `${parentKey}.${key}` : key;
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			// Inline simple objects as TOML inline tables if they contain no nested objects
			const entries = Object.entries(value);
			const hasNested = entries.some(isNested);
			if (!hasNested) {
				const inner = entries
					.map(
						([internalKey, internalValue]): string =>
							`${serializeValue(internalKey)} = ${serializeValue(internalValue)}`,
					)
					.join(", ");
				lines[linesLength++] = `${key} = { ${inner} }`;
			} else tables[tablesLength++] = { key: fullKey, value };
		} else lines[linesLength++] = `${key} = ${serializeValue(value)}`;
	}

	let result = lines.join("\n");
	for (const { key, value } of tables) result += `\n\n[${key}]\n${serializeToml(value, key)}`;
	return result;
}

interface CompilerOptions {
	/**
	 * Specify type package names to be included without being referenced in a
	 * source file.
	 *
	 * See more: https://www.typescriptlang.org/tsconfig#types.
	 */
	types?: Array<string>;
}
interface TsConfiguration {
	/** Instructs the TypeScript compiler how to compile .ts files. */
	compilerOptions?: CompilerOptions;

	/**
	 * Specifies a list of glob patterns that match files to be included in
	 * compilation. If no 'files' or 'include' property is present in a
	 * tsconfig.json, the compiler defaults to including all files in the
	 * containing directory and subdirectories except those specified by
	 * 'exclude'. Requires TypeScript version 2.0 or later.
	 */
	include?: Array<string>;
}

function isString(value: unknown): value is string {
	return typeof value === "string";
}
function isPartialTsConfiguration(value: unknown): value is Partial<TsConfiguration> {
	return typeof value === "object" && value !== null;
}
function isTsConfiguration(value: unknown): value is TsConfiguration {
	if (!isPartialTsConfiguration(value)) return false;
	if ("compilerOptions" in value) {
		const { compilerOptions } = value;
		if (typeof compilerOptions !== "undefined" && typeof compilerOptions !== "object") return false;
		if (compilerOptions && "types" in compilerOptions) {
			const { types } = compilerOptions;
			if (typeof types !== "undefined" && (!Array.isArray(types) || !types.every(isString))) return false;
		}
	}

	if ("include" in value) {
		const { include } = value;
		if (typeof include !== "undefined" && (!Array.isArray(include) || !include.every(isString))) return false;
	}

	return true;
}

function cleanJson(input: string): string {
	return input
		.replace(/(^|[^\\])\/\/.*$/gm, "")
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/,\s*([}\]])/g, "$1")
		.trim();
}

async function parseJsonAsync(input: Bun.BunFile | string): Promise<unknown> {
	const text = typeof input === "string" ? input : await input.text();
	try {
		return JSON.parse(text);
	} catch (error) {
		if (error instanceof SyntaxError) {
			const cleaned = cleanJson(text);
			try {
				return JSON.parse(cleaned);
			} catch (subError) {
				throw new Error(
					`Failed to parse JSON after cleaning comments/trailing commas: ${
						subError instanceof Error ? subError.message : String(subError)
					}`,
				);
			}
		}

		throw error;
	}
}

async function readTsConfigurationAsync(filePath: string): Promise<TsConfiguration> {
	const file = Bun.file(filePath);
	const exists = await file.exists();
	if (!exists) throw new Error(`tsconfig file not found: ${filePath}`);

	const typeScriptConfiguration = await parseJsonAsync(file);

	if (!isTsConfiguration(typeScriptConfiguration))
		throw new Error(`Invalid tsconfig file: ${filePath} does not conform to the expected schema`);

	return typeScriptConfiguration;
}

const CWD = process.cwd();
const CWD_PREFIX_REGEX = new RegExp(`^${CWD.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}/`);
const RANGE_PLUGIN_PATH = join(CWD, "plugins", "bun", "range-plugin.ts");
const BUNFIG_PATH = join(CWD, "bunfig.toml");
const TYPESCRIPT_CONFIGURATION_PATH = join(CWD, "tsconfig.json");

const PLUGIN_CONTENT = `import rangeMacroPlugin from "bun-range-macro";

await Bun.plugin(rangeMacroPlugin);
`;

function stripCwd(value: string): string {
	return value.replace(CWD_PREFIX_REGEX, "");
}

function removeDuplicates<T>(array: ReadonlyArray<T>): Array<T> {
	return [...new Set(array)];
}

function normalizePreload(preload: Array<string> | string | undefined): Array<string> {
	const pluginPath = stripCwd(RANGE_PLUGIN_PATH);
	if (typeof preload === "string") return removeDuplicates([preload, pluginPath]);
	if (Array.isArray(preload)) return removeDuplicates([...preload, pluginPath]);
	return [pluginPath];
}

const MATCH_LINE_REGEX = /^( +|\t+)/;
const SPLIT_LINES_REGEX = /\r?\n/;
function mapLine(line: string): null | RegExpMatchArray {
	return line.match(MATCH_LINE_REGEX);
}
function isRegExpMatchArray(match: null | RegExpMatchArray): match is RegExpMatchArray {
	return match !== null;
}
function mapMatch(match: RegExpMatchArray): string {
	return match[0];
}

interface TabsIndentation {
	readonly isTabs: true;
}
interface SpacesIndentation {
	readonly isTabs: false;
	readonly size: number;
}
type Indentation = SpacesIndentation | TabsIndentation;

function detectIndentation(content: string): Indentation {
	const lines = content.split(SPLIT_LINES_REGEX);
	const indentations = lines.map(mapLine).filter(isRegExpMatchArray).map(mapMatch);

	if (indentations.length === 0) return { isTabs: true };

	const firstIndentation = indentations[0]!;
	const type = firstIndentation.startsWith("\t") ? "tab" : "space";
	const size = type === "tab" ? 1 : firstIndentation.length;
	return { isTabs: false, size };
}

// actual code

async function setupPluginAsync(): Promise<void> {
	await Bun.file(RANGE_PLUGIN_PATH).write(PLUGIN_CONTENT);
	console.log(`Created plugin at ${stripCwd(RANGE_PLUGIN_PATH)}`);
}

async function setupInstallAsync(): Promise<void> {
	await Bun.spawn(["bun", "add", "bun-range-macro"]).exited;
}

async function setupBunfigAsync(): Promise<void> {
	const file = Bun.file(BUNFIG_PATH);
	const exists = await file.exists();

	let configuration: BunConfiguration;
	if (exists) {
		configuration = await readBunConfigurationAsync(BUNFIG_PATH);
		configuration.define = {
			...configuration.define,
			$range: "$range",
		};
		configuration.preload = normalizePreload(configuration.preload);
		configuration.test = {
			...configuration.test,
			preload: normalizePreload(configuration.test?.preload),
		};
	} else {
		configuration = {
			define: { $range: "$range" },
			preload: normalizePreload(undefined),
			test: { preload: normalizePreload(undefined) },
		};
	}

	await file.write(serializeToml(configuration));
	console.log(`Updated bunfig.toml at ${stripCwd(BUNFIG_PATH)}`);
}

async function setupTsConfigAsync(): Promise<void> {
	const file = Bun.file(TYPESCRIPT_CONFIGURATION_PATH);
	const exists = await file.exists();
	if (exists) {
		const indentation = await file.text().then(detectIndentation);
		const configuration = await readTsConfigurationAsync(TYPESCRIPT_CONFIGURATION_PATH);

		configuration.compilerOptions = {
			...configuration.compilerOptions,
			types: removeDuplicates([...(configuration.compilerOptions?.types ?? []), "bun-types", "bun-range-macro"]),
		};
		configuration.include = removeDuplicates([
			...(configuration.include ?? []),
			"plugins/bun/**/*.ts",
			"plugins/bun/**/*.tsx",
		]);

		const contents = indentation.isTabs
			? JSON.stringify(configuration, null, "\t")
			: JSON.stringify(configuration, null, indentation.size);
		await file.write(contents);
	} else {
		// where is your tsconfig lol
		const configuration: TsConfiguration = {
			compilerOptions: {
				types: ["bun-types", "bun-range-macro"],
			},
			include: ["plugins/bun/**/*.ts", "plugins/bun/**/*.tsx"],
		};
		await file.write(JSON.stringify(configuration, null, "\t"));
	}
}

await setupInstallAsync();
await setupPluginAsync();
await setupBunfigAsync();
await setupTsConfigAsync();
