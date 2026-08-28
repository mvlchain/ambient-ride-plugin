#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const QR_INSTRUCTION = 'Scan this QR to approve the login in the TADA/Throo app:';
const ANSI = /\x1b\[[0-9;]*m/g;
const QR_GLYPH = /[█▀▄]/g;
const STATUS_BOUNDARY = /^(?:status[ \t]*:|[ \t]*\{)/m;

function statusBoundary(output) {
  return output.match(STATUS_BOUNDARY);
}

function unwrapShellCommand(command) {
  const match = command.match(/^\s*(?:[^\s'"]*\/)?(?:bash|sh)\s+-lc\s+(['"])([\s\S]*)\1\s*$/);
  return match?.[2] ?? command;
}

export function isMemberLoginCommand(command) {
  if (typeof command !== 'string') return false;
  const inner = unwrapShellCommand(command);
  const invocation = inner.match(
    /^\s*(?:[A-Za-z_][A-Za-z0-9_]*=(?:'[^']*'|"[^"]*"|\S+)\s+)*(?:[^\s'"]*\/)?amb\s+login(?:\s|$)([\s\S]*)$/,
  );
  return !!invocation && /(?:^|\s)--no-wait(?:\s|$)/.test(invocation[1]);
}

export function extractLoginQr(stderr) {
  if (typeof stderr !== 'string') return undefined;
  const start = stderr.indexOf(QR_INSTRUCTION);
  if (start < 0) return undefined;

  const tail = stderr.slice(start);
  const status = statusBoundary(tail);
  const block = tail.slice(0, status?.index ?? tail.length).trimEnd();
  const qrLines = block
    .replace(ANSI, '')
    .split('\n')
    .slice(1)
    .filter((line) => (line.match(QR_GLYPH)?.length ?? 0) >= 5);
  return qrLines.length >= 10 ? block : undefined;
}

export function replaceLoginQrWithPreviewSpacer(output) {
  if (typeof output !== 'string') return '';
  const start = output.indexOf(QR_INSTRUCTION);
  if (start < 0) return output;

  const tail = output.slice(start);
  const status = statusBoundary(tail);
  const suffix = status?.index === undefined ? '' : tail.slice(status.index);
  return `${output.slice(0, start)}\n\n\n\n${suffix}`;
}

export function buildHookResponse(input) {
  if (input?.hook_event_name !== 'PostToolUse' || input?.tool_name !== 'Bash') return null;
  if (!isMemberLoginCommand(input.tool_input?.command)) return null;

  const stdout = typeof input.tool_response?.stdout === 'string' ? input.tool_response.stdout : '';
  const stderr = typeof input.tool_response?.stderr === 'string' ? input.tool_response.stderr : '';
  const output = `${stderr}\n${stdout}`;
  if (!/(?:"status"\s*:\s*"auth_required"|status:\s*auth_required)/.test(output)) {
    return null;
  }

  const qr = extractLoginQr(output);
  if (!qr) return null;

  return {
    systemMessage: qr,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      updatedToolOutput: {
        stdout: replaceLoginQrWithPreviewSpacer(stdout),
        stderr: replaceLoginQrWithPreviewSpacer(stderr),
        interrupted: input.tool_response?.interrupted === true,
        isImage: input.tool_response?.isImage === true,
      },
    },
  };
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const response = buildHookResponse(input);
  if (response) process.stdout.write(JSON.stringify(response));
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) void main();
