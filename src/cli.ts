import { createCli } from "@client-platform/kernel";
import { runBuild } from "./build.js";
import { runDoctor } from "./doctor.js";
import { initWebVite } from "./preset-web-vite.js";
import { DEFAULT_PRESET } from "./types.js";
import { runVerify } from "./verify.js";

function fail(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
}

export async function run(argv: string[]): Promise<void> {
  const program = createCli({
    name: "build-release",
    version: "0.0.0",
    description: "Client platform build and release toolkit",
  });

  program
    .command("init")
    .description("Initialize build-release with default preset web-vite")
    .option("--preset <name>", "preset name", DEFAULT_PRESET)
    .action(async (opts: { preset: string }) => {
      try {
        const written = await initWebVite(process.cwd(), opts.preset);
        for (const file of written) {
          console.log(`wrote ${file}`);
        }
        console.log(`init complete (preset=${opts.preset})`);
      } catch (err) {
        fail(err);
      }
    });

  program
    .command("build")
    .description("Build and emit outDir + artifact-manifest.json")
    .action(async () => {
      try {
        const manifestPath = await runBuild(process.cwd());
        console.log(`build complete: ${manifestPath}`);
      } catch (err) {
        fail(err);
      }
    });

  program
    .command("verify")
    .description("Verify artifact manifest and outputs")
    .action(async () => {
      try {
        const result = await runVerify(process.cwd());
        for (const check of result.checks) {
          console.log(`ok: ${check}`);
        }
        for (const error of result.errors) {
          console.error(`error: ${error}`);
        }
        if (!result.ok) {
          process.exit(1);
        }
        console.log("verify complete");
      } catch (err) {
        fail(err);
      }
    });

  program
    .command("doctor")
    .description("Product diagnostics")
    .action(async () => {
      const findings = await runDoctor(process.cwd());
      let failed = false;
      for (const finding of findings) {
        console.log(`[${finding.severity}] ${finding.code}: ${finding.message}`);
        if (finding.severity === "error") {
          failed = true;
        }
      }
      if (failed) {
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}
