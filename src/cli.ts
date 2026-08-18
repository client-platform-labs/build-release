import { createCli } from "@client-platform/kernel";

function stub(command: string, detail?: string): void {
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[build-release] ${command}: stub${suffix}`);
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
    .option("--preset <name>", "preset name", "web-vite")
    .action(async (opts: { preset: string }) => {
      stub("init", `preset=${opts.preset}`);
    });

  program
    .command("build")
    .description("Build and emit outDir + artifact-manifest.json")
    .action(async () => {
      stub("build");
    });

  program
    .command("verify")
    .description("Verify artifact manifest and outputs")
    .action(async () => {
      stub("verify");
    });

  program
    .command("doctor")
    .description("Product diagnostics")
    .action(async () => {
      stub("doctor");
    });

  await program.parseAsync(argv);
}
