import { execFileSync } from "node:child_process";
import { extname } from "node:path";

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".gz",
  ".tgz",
  ".lockb",
]);

const SKIP_PREFIXES = [
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  ".next/",
  ".husky/_/",
];

const SECRET_RULES = [
  { id: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: "aws-access-key", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{36}\b/ },
  { id: "gitlab-token", pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { id: "slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: "stripe-live-key", pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/ },
  {
    id: "url-basic-auth",
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@[^\s]+/i,
  },
  {
    id: "credential-assignment",
    pattern:
      /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|id[_-]?token|secret|client[_-]?secret|service[_-]?role[_-]?key|password|passwd|private[_-]?key)\b\s*[:=]\s*["'`]([^"'`\n]{8,})["'`]/i,
    valueIndex: 1,
  },
  {
    id: "env-credential-assignment",
    pattern:
      /^\s*(?:export\s+)?[A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|AUTH_TOKEN|SECRET|CLIENT_SECRET|SERVICE_ROLE_KEY|PASSWORD|PASSWD|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*([^\s#]{8,})\s*$/i,
    valueIndex: 1,
  },
];

function getStagedFiles() {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" }
  ).trim();

  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
}

function readStagedContent(filePath) {
  try {
    return execFileSync("git", ["show", `:${filePath}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function isPlaceholder(value) {
  const lowered = value.trim().toLowerCase();

  if (!lowered) {
    return true;
  }

  return (
    lowered.startsWith("your_") ||
    lowered.endsWith("_here") ||
    lowered.includes("example") ||
    lowered.includes("placeholder") ||
    lowered.includes("changeme") ||
    lowered.includes("replace") ||
    lowered.includes("dummy") ||
    lowered.includes("sample") ||
    lowered.includes("xxxx") ||
    lowered.includes("public-anon-key") ||
    lowered.includes("<") ||
    lowered.includes("localhost") ||
    lowered.includes("${")
  );
}

function mask(value) {
  if (value.length <= 8) {
    return "***";
  }

  return `${value.slice(0, 4)}...${value.slice(-2)}`;
}

function formatSnippet(line, match, valueToMask) {
  let snippet = line.trim();

  if (valueToMask) {
    snippet = snippet.replace(valueToMask, mask(valueToMask));
  } else if (match && match[0].length > 12) {
    snippet = snippet.replace(match[0], mask(match[0]));
  }

  if (snippet.length > 180) {
    return `${snippet.slice(0, 180)}...`;
  }

  return snippet;
}

const findings = [];

for (const filePath of getStagedFiles()) {
  if (SKIP_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    continue;
  }

  if (BINARY_EXTENSIONS.has(extname(filePath).toLowerCase())) {
    continue;
  }

  const stagedContent = readStagedContent(filePath);

  if (!stagedContent || stagedContent.includes("\u0000")) {
    continue;
  }

  const lines = stagedContent.split(/\r?\n/);

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = lines[lineNumber];

    for (const rule of SECRET_RULES) {
      const match = line.match(rule.pattern);

      if (!match) {
        continue;
      }

      const extractedValue =
        typeof rule.valueIndex === "number" ? match[rule.valueIndex] : null;

      if (extractedValue) {
        const unquotedValue = extractedValue.replace(/^["'`]|["'`]$/g, "");

        if (isPlaceholder(unquotedValue)) {
          continue;
        }

        findings.push({
          filePath,
          line: lineNumber + 1,
          rule: rule.id,
          snippet: formatSnippet(line, match, unquotedValue),
        });
        break;
      }

      findings.push({
        filePath,
        line: lineNumber + 1,
        rule: rule.id,
        snippet: formatSnippet(line, match, match[0]),
      });
      break;
    }
  }
}

if (findings.length > 0) {
  console.error("\nSecret scan failed: potential credentials found in staged files.\n");

  for (const finding of findings) {
    console.error(
      `- ${finding.filePath}:${finding.line} [${finding.rule}] ${finding.snippet}`
    );
  }

  console.error(
    "\nUse placeholders in committed files and keep real secrets in ignored env files."
  );
  process.exit(1);
}
