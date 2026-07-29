/**
 * S'assure que frontend/public/config.json existe avant `npm run dev`
 * ou `npm run build`.
 *
 * But : qu'un(e) collègue qui clone le dépôt pour la première fois n'ait
 * JAMAIS de crash ni d'erreur cryptique. Si config.json est absent
 * (normal : il est ignoré par git, voir .gitignore, car il dépend de
 * chaque machine), on le crée automatiquement à partir de
 * config.example.json avec les valeurs par défaut XAMPP classiques.
 * La personne n'a plus qu'à l'ouvrir et corriger api.baseUrl si besoin.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicConfig = join(here, "../public/config.json");
const exampleConfig = join(here, "../public/config.example.json");

if (!existsSync(publicConfig)) {
  copyFileSync(exampleConfig, publicConfig);
  console.log("✓ frontend/public/config.json créé à partir de config.example.json");
  console.log("  → vérifie/adapte api.baseUrl si ton XAMPP n'utilise pas http://localhost/explorateur/backend");
} else {
  console.log("✓ frontend/public/config.json déjà présent");
}
