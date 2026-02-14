
import { join } from "@std/path";

const FILES = {
    DOCKERFILE: ".devcontainer/Dockerfile",
};

async function getLatestGitHubRelease(owner: string, repo: string): Promise<string> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch latest release for ${owner}/${repo}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.tag_name; // usually includes 'v' prefix
}

async function getLatestNpmVersion(packageName: string): Promise<string> {
    // Use npm registry public API
    const url = `https://registry.npmjs.org/${packageName}/latest`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch latest version for ${packageName}: ${res.statusText}`);
    }
    const data = await res.json();
    return `v${data.version}`;
}

async function updateDockerfile() {
    const dockerfilePath = join(Deno.cwd(), FILES.DOCKERFILE);
    let content = await Deno.readTextFile(dockerfilePath);

    // 1. Deno (GitHub)
    try {
        const latestDenoTag = await getLatestGitHubRelease("denoland", "deno");
        const denoVersion = latestDenoTag.replace(/^v/, ""); // remove v prefix
        console.log(`Latest Deno: ${denoVersion}`);
        content = content.replace(
            /ARG DENO_VERSION=.+/,
            `ARG DENO_VERSION=${denoVersion}`
        );
    } catch (e) {
        console.error(`Error updating Deno: ${e}`);
    }

    // 2. Playwright (NPM)
    // Docker tag: v1.58.0-noble. We need to preserve the -noble suffix 
    try {
        const playwrightRegex = /ARG PLAYWRIGHT_VERSION=(v[\d\.]+)(-[a-z]+)?/;
        const match = content.match(playwrightRegex);
        if (match) {
            const currentSuffix = match[2] || ""; // e.g. -noble
            const latestPlaywright = await getLatestNpmVersion("playwright");
            console.log(`Latest Playwright: ${latestPlaywright}`);

            content = content.replace(
                playwrightRegex,
                `ARG PLAYWRIGHT_VERSION=${latestPlaywright}${currentSuffix}`
            );
        }
    } catch (e) {
        console.error(`Error updating Playwright: ${e}`);
    }

    // 3. Dagger (GitHub)
    try {
        const latestDagger = await getLatestGitHubRelease("dagger", "dagger");
        console.log(`Latest Dagger: ${latestDagger}`);
        content = content.replace(
            /ARG DAGGER_VERSION=.+/,
            `ARG DAGGER_VERSION=${latestDagger}`
        );
    } catch (e) {
        console.error(`Error updating Dagger: ${e}`);
    }

    await Deno.writeTextFile(dockerfilePath, content);
    console.log("Updated .devcontainer/Dockerfile");
}

if (import.meta.main) {
    await updateDockerfile();
}
