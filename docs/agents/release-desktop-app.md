# `release/desktop-app` Desktop Guide

## Owns

- Desktop runtime and packaging.
- Installers, platform metadata, build/release automation, and distribution.
- Desktop-only filesystem, security, startup, offline, and platform integration.

## Does not own

- Gameplay rules, balance, AI, weapons, timeline, win/loss, or meta progression.
- UI/art design or gameplay-facing visual changes.

## Shared-file rule

Before editing `package.json`, lockfiles, `index.html`, build configuration, web
entry points, preload/asset paths, or shared docs, report the exact desktop need
and cross-branch impact and obtain Project Lead approval.

## Verification

Run the web production build, desktop startup, and an appropriate package or
installer dry run. When relevant, verify offline assets, CSP/security, filesystem
paths, audio, and clean uninstall/upgrade behavior. Report final Git status.
