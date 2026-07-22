# pi-side-chat

Experimental `/btw` side questions for Pi. It snapshots stable main-session messages, makes one tool-free model call, shows the answer outside the transcript, and leaves the main agent thread untouched.

```text
/btw which config file did we discuss?
```

## Guarantees

- no tools or agent loop
- no `sendMessage`, `sendUserMessage`, or appended session entry
- no merge into the parent context
- one request at a time
- answer displayed as an overlay in TUI mode or an extension UI notification in RPC mode
- side question and answer are absent from later compaction input
- currently streaming partial main output is intentionally excluded from the stable snapshot

## Install

```bash
pi install git:github.com/baladithyab/pi-side-chat@v0.1.1
```

## Current scope

V0.1 uses the active parent model, disables tools, requests at most 1,200 output tokens, requests no prompt-cache retention, and keeps no side-answer history. Run `/btw-cancel` to abort an in-flight side request independently. It does not yet provide answer navigation, copy, configurable side models, or explicit promotion into a fork.

This package is experimental. Validate transcript isolation and concurrent behavior in a disposable Pi home before primary installation.

## Development

```bash
bun install
bun run check
```
