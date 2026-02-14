import { Directory, object, func, Secret } from "@dagger.io/dagger"

@object()
export class Nekolog {
    /**
     * Build the CI container from the Dockerfile.
     */
    private buildCiContainer(source: Directory) {
        return source
            .dockerBuild({ dockerfile: ".devcontainer/Dockerfile" })
            .withDirectory("/src", source)
            .withWorkdir("/src")
            .withEnvVariable("CI", "true")
    }


    /**
     * Run lint, unit tests, and build tasks.
     */
    @func()
    async test(source: Directory): Promise<string> {
        const ctr = this.buildCiContainer(source)
            .withExec(["deno", "install"])
            .withExec(["deno", "task", "lint"])
            .withExec(["deno", "task", "test:all"])
            .withExec(["deno", "task", "build"])

        return await ctr.stdout()
    }

    /**
     * Build frontend and compile binaries for all platforms.
     * Returns the bin directory containing all compiled binaries.
     */
    @func()
    release(source: Directory): Directory {
        const ctr = this.buildCiContainer(source)
            .withExec(["deno", "install"])
            .withExec(["deno", "task", "build"])
            .withExec(["deno", "task", "compile:all"])

        return ctr.directory("/src/bin")
    }

    /**
     * Build the web application for deployment.
     * Returns the dist directory containing the static site.
     */
    @func()
    buildWeb(source: Directory, basePath = "/"): Directory {
        const ctr = this.buildCiContainer(source)
            .withEnvVariable("BASE_PATH", basePath)
            .withExec(["deno", "install"])
            .withExec(["deno", "task", "build"])

        return ctr.directory("/src/dist")
    }

    /**
     * Deploy the application to Deno Deploy.
     */
    @func()
    async deploy(source: Directory, token: Secret): Promise<string> {
        const ctr = this.buildCiContainer(source)
            .withSecretVariable("DENO_DEPLOY_TOKEN", token)
            .withExec(["deno", "install"])
            .withExec(["deno", "task", "build"])
            .withExec([
                "deno", "deploy",
                "--project=nekolog",
                "--exclude=node_modules",
                "--static-dir=dist",
                "."
            ])

        return await ctr.stdout()
    }

    /**
     * Run CI tasks (test and release).
     */
    @func()
    async ci(source: Directory): Promise<Directory> {
        await this.test(source)
        return this.release(source)
    }
}
