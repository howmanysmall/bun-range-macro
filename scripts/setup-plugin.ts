#!/usr/bin/env bun

import { join } from "node:path";

import { type BunConfiguration, readBunConfigurationAsync, serializeToml } from "./read-bunfig";

const CWD = process.cwd();
const CWD_PREFIX_REGEX = new RegExp(`^${CWD.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}/`);
const RANGE_PLUGIN_PATH = join(CWD, "plugins", "bun", "range-plugin.ts");
const BUNFIG_PATH = join(CWD, "bunfig.toml");

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

async function createPluginAsync(): Promise<void> {
	await Bun.file(RANGE_PLUGIN_PATH).write(PLUGIN_CONTENT);
	console.log(`Created plugin at ${stripCwd(RANGE_PLUGIN_PATH)}`);
}

async function setupConfigurationAsync(): Promise<void> {
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

await createPluginAsync();
await setupConfigurationAsync();
