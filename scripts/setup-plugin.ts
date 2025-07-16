#!/usr/bin/env bun

import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { readBunConfigurationAsync, serializeToml } from "./read-bunfig";

type FileContents = ArrayBuffer | Bun.ArrayBufferView | Bun.BunFile | Request | Response | SharedArrayBuffer | string;

async function isDirectoryAsync(path: string): Promise<boolean> {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

async function makeDirectoryAsync(path: string): Promise<void> {
	const exists = await isDirectoryAsync(path);
	if (!exists) await mkdir(path, { recursive: true });
}

async function readJsonAsync<T>(path: string, validate: (contents: unknown) => contents is T): Promise<T> {
	const file = Bun.file(path);
	const exists = await file.exists();
	if (!exists) throw new Error(`File not found: ${path}`);

	const contents = await file.json();
	if (!validate(contents)) throw new Error(`Invalid JSON structure in ${path}`);
	return contents;
}

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

const RANGE_PLUGIN_PATH = join(CWD, "plugins", "bun", "range-plugin.ts");
const TSCONFIG_FILE_PATH = join(CWD, "tsconfig.json");

async function createPluginAsync(): Promise<void> {
	await writeFileAsync(
		RANGE_PLUGIN_PATH,
		`import rangeMacroPlugin from "bun-range-macro";

await Bun.plugin(rangeMacroPlugin);`,
	);
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

		const preload = configuration.preload ?? [];

		if (preload) {
			if (typeof preload === "string") configuration.preload = removeDuplicates([preload, RANGE_PLUGIN_PATH]);
			else if (Array.isArray(preload)) configuration.preload = removeDuplicates([...preload, RANGE_PLUGIN_PATH]);
			else throw new Error(`Unexpected type for preload: ${typeof preload}`);
		} else configuration.preload = [RANGE_PLUGIN_PATH];

		await file.write(serializeToml(configuration));
	}
}

await createPluginAsync();
await setupConfigurationAsync();
