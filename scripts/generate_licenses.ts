
console.log("🔍 Scanning dependency tree...");

// 1. Get the full dependency graph from Deno itself
const command = new Deno.Command("deno", {
    args: ["info", "--json", "src/main.tsx"], // Entry point
});
const { stdout } = await command.output();
const info = JSON.parse(new TextDecoder().decode(stdout));

// 2. Extract unique modules (npm, jsr)
// Key: "name@version"
const modules = new Map<string, { name: string; version: string; type: "npm" | "jsr" }>();

// Process npmPackages if available
if (info.npmPackages) {
    for (const key in info.npmPackages) {
        const pkg = info.npmPackages[key];
        const uniqueKey = `${pkg.name}@${pkg.version}`;
        modules.set(uniqueKey, {
            name: pkg.name,
            version: pkg.version,
            type: "npm",
        });
    }
}

function processModule(specifier: string) {
    if (specifier.startsWith("jsr:")) {
        const clean = specifier.replace("jsr:", "");
        // JSR specifiers: @scope/pkg@version or similar
        // Often: @scope/pkg@version/path...
        // We want the package root.
        const parts = clean.split("/");
        let name = parts[0];
        if (name.startsWith("@")) {
            name = parts[0] + "/" + parts[1];
        }
        // Version is usually part of the path or implicitly handled? 
        // Actually "jsr:" specifiers in 'modules' might be fully resolved.
        // Example: jsr:@std/path@0.213.0/mod.ts
        // We need to parse robustly.

        // Regex for JSR specifier: jsr:(@scope/name)@version(/path)?
        const match = clean.match(/^(@[^/]+\/[^@/]+)@([^/]+)/);
        if (match) {
            const name = match[1];
            const version = match[2];
            const uniqueKey = `${name}@${version}`;
            modules.set(uniqueKey, { name, version, type: "jsr" });
        }
    }
}

// Recursively walk the module graph
if (info.modules) {
    for (const mod of info.modules) {
        if (mod.specifier) {
            processModule(mod.specifier);
        }
    }
}

console.log(`✅ Found ${modules.size} unique 3rd-party modules.`);

// 3. Helper to fetch license text
async function fetchLicense(name: string, version: string, type: "npm" | "jsr"): Promise<string | null> {
    try {
        if (type === "npm") {
            // Try unpkg for common license files
            const candidates = ["LICENSE", "LICENSE.txt", "LICENSE.md", "LICENSE.MIT", "LICENSE.Apache-2.0"];
            for (const candidate of candidates) {
                const url = `https://unpkg.com/${name}@${version}/${candidate}`;
                const res = await fetch(url);
                if (res.ok) {
                    return await res.text();
                }
            }

            // Fallback: try to get license type from registry
            const regUrl = `https://registry.npmjs.org/${name}/${version}`;
            const res = await fetch(regUrl);
            if (res.ok) {
                const meta = await res.json();
                if (meta.license) {
                    return `License: ${meta.license} (Full text not found automatically, please check https://www.npmjs.com/package/${name}/v/${version})`;
                }
            }

        } else if (type === "jsr") {
            // JSR: Try to fetch LICENSE file from jsr.io
            // URL format: https://jsr.io/@scope/package/version/LICENSE
            const candidates = ["LICENSE", "LICENSE.txt", "LICENSE.md"];
            for (const candidate of candidates) {
                // name is like @scope/pkg
                const url = `https://jsr.io/${name}/${version}/${candidate}`;
                const res = await fetch(url);
                if (res.ok) {
                    return await res.text();
                }
            }
        }
    } catch (e) {
        console.error(`Failed to fetch license for ${name}:`, e);
    }
    return null;
}

// 4. Generate the text file
let licenseText = "THIRD PARTY SOFTWARE NOTICES\n\n";
licenseText += "This software includes the following third-party software components:\n\n";

// Sort by name for deterministic output
const sortedModules = Array.from(modules.values()).sort((a, b) => a.name.localeCompare(b.name));

// Process with concurrency limit
const CONCURRENCY = 10;
const results = [];
for (let i = 0; i < sortedModules.length; i += CONCURRENCY) {
    const chunk = sortedModules.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(async (mod) => {
        console.log(`Processing ${mod.name}@${mod.version}...`);
        const text = await fetchLicense(mod.name, mod.version, mod.type);
        return { ...mod, text };
    }));
    results.push(...chunkResults);
}


for (const { name, version, type, text } of results) {
    licenseText += `-------------------------------------------------------\n`;
    licenseText += `Package: ${name}\n`;
    licenseText += `Version: ${version}\n`;
    licenseText += `Source: ${type}\n`;

    if (text) {
        licenseText += `\n${text.trim()}\n\n`;
    } else {
        licenseText += `\nLicense: Unknown (Check source)\n\n`;
    }
}

await Deno.writeTextFile("./public/THIRD-PARTY-NOTICES.txt", licenseText);
console.log("🎉 Wrote metadata to ./public/THIRD-PARTY-NOTICES.txt");
