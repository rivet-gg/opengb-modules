import { Registry } from '../registry/mod.ts';
import * as path from "std/path/mod.ts";

const moduleName = Deno.args[0];
if (!moduleName) throw new Error("Module name required");

const registry = await Registry.load();

if (registry.modules.has(moduleName)) {
    throw new Error("Module already exists");
}

// Create directires
const modulePath = path.join(registry.path, "modules", moduleName);
await Deno.mkdir(modulePath);
await Deno.mkdir(path.join(modulePath, "scripts"));
await Deno.mkdir(path.join(modulePath, "tests"));
await Deno.mkdir(path.join(modulePath, "db"));
await Deno.mkdir(path.join(modulePath, "db", "migrations"));
await Deno.mkdir(path.join(modulePath, "schema"));

// Write default config
const moduleYaml =
`scripts: {}
errors: {}
`;
await Deno.writeTextFile(path.join(modulePath, "module.yaml"), moduleYaml);

// Write default migration
const migrationSql =
`-- TODO: Write migration
`;
await Deno.writeTextFile(path.join(modulePath, "db", "migrations", "0001_init.sql"), migrationSql);