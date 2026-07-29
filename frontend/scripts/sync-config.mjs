import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rootConfig = join(here, "../../config.json");
const publicConfig = join(here, "../public/config.json");

if (!existsSync(rootConfig)) {
  console.error("❌ Fichier manquant : config.json à la racine du projet");
  console.error("   Copiez config.example.json vers config.json et adaptez api.baseUrl");
  process.exit(1);
}

copyFileSync(rootConfig, publicConfig);
console.log("✓ config.json synchronisé → frontend/public/config.json");
