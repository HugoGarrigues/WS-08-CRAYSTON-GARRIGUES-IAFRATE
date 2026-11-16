import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("../", import.meta.url));
function executer(commande, argumentsOutil) {
  const resultat =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", commande], {
          cwd: racine,
          stdio: "inherit",
        })
      : spawnSync("npx", argumentsOutil, { cwd: racine, stdio: "inherit" });
  if (resultat.error) throw resultat.error;
  return resultat.status ?? 1;
}

/** NC-103 : valider et valoriser le schéma avant sa publication. */
export function valoriserSchemaPivot() {
  return executer(
    "npx --yes @stoplight/spectral-cli lint openapi.yaml --ruleset .spectral.yaml",
    [
      "--yes",
      "@stoplight/spectral-cli",
      "lint",
      "openapi.yaml",
      "--ruleset",
      ".spectral.yaml",
    ],
  );
}

/** NC-203 : lancer le mock Prism directement à partir du contrat. */
export function mockerContratPivot() {
  return executer("npx --yes @stoplight/prism-cli mock openapi.yaml", [
    "--yes",
    "@stoplight/prism-cli",
    "mock",
    "openapi.yaml",
  ]);
}

function genererDocumentation() {
  return executer(
    "npx --yes @redocly/cli build-docs openapi.yaml -o docs/index.html",
    [
      "--yes",
      "@redocly/cli",
      "build-docs",
      "openapi.yaml",
      "-o",
      "docs/index.html",
    ],
  );
}

const operations = {
  lint: valoriserSchemaPivot,
  mock: mockerContratPivot,
  docs: genererDocumentation,
};
const operation = operations[process.argv[2] ?? "lint"];
if (!operation) {
  process.stderr.write("Usage : node scripts/openapi.mjs [lint|mock|docs]\n");
  process.exitCode = 1;
} else {
  process.exitCode = operation();
}
