import { $ } from "bun";

await Bun.build({
	root: "./lib",
	entrypoints: ["lib/tag-cache.ts"],
	outdir: "./dist",
});

await $`bun tsc --emitDeclarationOnly --noEmit false`;
