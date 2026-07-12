# claude-statusline

An always-on widget for claude.ai that replicates the Claude Code statusline. It shows
three meter bars in the bottom-right corner:

- **Context**: estimated token usage for the current conversation vs the model window.
- **Session**: 5-hour rate-limit utilization.
- **Weekly**: 7-day rate-limit utilization.

Delivered as a standalone Manifest V3 Chrome extension. It runs same-origin on
claude.ai and reads Claude's own usage API with your existing session, so there is no
login step, no tokens, and no external servers.

## Status

Pre-implementation. The design is approved. Code lands next.

## Install (once built)

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked" and select this folder.
4. Open claude.ai. The widget appears in the bottom-right.

## Notes

The context number is an estimate from a character heuristic, not Claude's real
tokenizer, so it is marked with `~` and `est.`. Session and weekly are exact.
