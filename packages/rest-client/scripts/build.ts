import { $ } from "bun";

await Bun.build({
	root: "./lib",
	entrypoints: ["lib/rest-client.ts"],
	outdir: "./dist",
});

await $`bun tsc --emitDeclarationOnly --noEmit false`;
