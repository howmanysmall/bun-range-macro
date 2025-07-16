#!/usr/bin/env bun

import { join } from "node:path";

import { type BunConfiguration, readBunConfigurationAsync, serializeToml } from "./read-bunfig";

type FileContents = ArrayBuffer | Bun.ArrayBufferView | Bun.BunFile | Request | Response | SharedArrayBuffer | string;

async function writeFileAsync(path: string, fileContents: FileContents): Promise<void> {
	await Bun.file(path).write(fileContents);
}

function removeDuplicates<T extends NonNullable<unknown>>(array: Array<T>): Array<T> {
	const set = new Set<T>();
	const newArray = new Array<T>();
	let length = 0;

	for (const value of array) {
		if (set.has(value)) continue;
		set.add(value);
		newArray[length++] = value;
	}

	return newArray;
}

const CWD = process.cwd();
const CWD_PREFIX = new RegExp(`^${CWD}/`);

const RANGE_PLUGIN_PATH = join(CWD, "plugins", "bun", "range-plugin.ts");

function stripCwd(value: string): string {
	return value.replace(CWD_PREFIX, "");
}

async function createPluginAsync(): Promise<void> {
	await writeFileAsync(
		RANGE_PLUGIN_PATH,
		`import rangeMacroPlugin from "bun-range-macro";

await Bun.plugin(rangeMacroPlugin);
`,
	);

	console.log(`Created plugin at ${stripCwd(RANGE_PLUGIN_PATH)}`);
}

function getPreload(preload: Array<string> | string): Array<string> {
	if (typeof preload === "string") return removeDuplicates([preload, stripCwd(RANGE_PLUGIN_PATH)]);
	if (Array.isArray(preload)) return removeDuplicates([...preload, stripCwd(RANGE_PLUGIN_PATH)]);
	throw new Error(`Unexpected type for preload: ${typeof preload}`);
}

async function setupConfigurationAsync(): Promise<void> {
	const path = join(CWD, "bunfig.toml");
	const file = Bun.file(path);
	const exists = await file.exists();
	if (exists) {
		const configuration = await readBunConfigurationAsync(path);
		configuration.define = {
			...configuration.define,
			$range: "$range",
		};

		configuration.preload = getPreload(configuration.preload ?? []);
		configuration.test = {
			...configuration.test,
			preload: getPreload(configuration.test?.preload ?? []),
		};

		await file.write(serializeToml(configuration));
	} else {
		const configuration: BunConfiguration = {
			define: { $range: "$range" },
			preload: getPreload([]),
			test: { preload: getPreload([]) },
		};
		await file.write(serializeToml(configuration));
	}

	console.log(`Updated bunfig.toml at ${stripCwd(path)}`);
}

await createPluginAsync();
await setupConfigurationAsync();
