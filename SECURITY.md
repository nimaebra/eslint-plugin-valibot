# Security Policy

## Supported Versions

`eslint-plugin-valibot` follows semantic versioning. Only the latest published
major version receives security fixes.

| Version | Supported |
| :------ | :-------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

This package is a static-analysis (ESLint) plugin, so its main security
surface is: supply-chain integrity of the published package, and correctness
of autofixes (a fix should never turn valid code into something unsafe).

If you believe you've found a security issue — for example a malicious or
unsafe autofix, a ReDoS-prone pattern in a rule, or a supply-chain concern
with the published package — please **do not** open a public issue.

Instead, report it privately by emailing **nimaebra75@gmail.com** with:

- A description of the issue and its impact
- Steps to reproduce, including the rule and config involved if applicable
- The affected version(s)

You should expect an initial response within a few days. Once a fix is
available, it will be released and credited in the changelog unless you
prefer to remain anonymous.

## Scope

Out of scope: vulnerabilities in Valibot itself (report those to the
[Valibot project](https://github.com/fabian-hiller/valibot)), or in ESLint
core.
