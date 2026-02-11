import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import open from 'open';

const app = new Hono();

// Security Headers Middleware
app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Content-Security-Policy', "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none';");
});

// Helper to read files from the internal bundle using import.meta.url
// This ensures paths are resolved relative to the script, not the CWD.
const readInternalFile = async (path: string) => {
    try {
        const url = new URL(path, import.meta.url);
        return await Deno.readFile(url);
    } catch (_e) {
        return null;
    }
};

app.get('/', serveStatic({
    path: 'dist/index.html',
    getContent: readInternalFile
}));

app.use('/*', serveStatic({
    root: 'dist',
    getContent: readInternalFile
}));

app.get('*', serveStatic({
    path: 'dist/index.html',
    getContent: readInternalFile
}));

// use a random port
const port = 0;

console.log(`Server starting...`);

Deno.serve({
    port,
    onListen: ({ port, hostname }) => {
        console.log(`Listening on http://${hostname}:${port}`);
        // Use a non-fatal attempt to open the browser
        open(`http://localhost:${port}`).catch((_e) => {
            // Log error but don't crash
            // console.error('Failed to open browser (non-fatal):', e);
        });
    }
}, app.fetch);
