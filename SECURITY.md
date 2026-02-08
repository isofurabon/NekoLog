# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in NekoLog,
please report it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. Report privately via [GitHub Security Advisories](https://github.com/isofurabon/NekoLog/security/advisories/new)
3. Alternatively, contact the maintainer directly through GitHub

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

We aim to respond as quickly as possible, but please understand that this is a
community-maintained project. Response times may vary depending on maintainer
availability and the complexity of the issue.

**Our goals** (not guarantees):

- **Initial response**: Within a few days
- **Status update**: Within 1-2 weeks
- **Fix timeline**: Depends on severity and complexity

We appreciate your patience and understanding. Rest assured that all security
reports are taken seriously and will be addressed as soon as we are able.

### Security Considerations

NekoLog is a browser-based tool that:

- Uses **WebUSB** to connect to Android devices (requires user permission)
- Runs a local server on a **random port** bound to localhost only
- Implements **security headers** (CSP, X-Frame-Options, etc.)
- Does **not** transmit data to external servers

### Scope

The following are in scope for security reports:

- Vulnerabilities in NekoLog's code
- XSS, CSRF, or injection vulnerabilities
- Insecure handling of user data
- Authentication/authorization bypasses

Out of scope:

- Vulnerabilities in third-party dependencies (report to upstream)
- Issues requiring physical access to the user's machine
- Social engineering attacks

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers
who report valid vulnerabilities (unless they prefer to remain anonymous).
