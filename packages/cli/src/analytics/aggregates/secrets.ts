/**
 * Secrets detection in shell history
 */

import type { CommandEvent } from '../../history/models';
import type { SecretsStats, SecretMatch } from '../models';

interface SecretPattern {
  pattern: RegExp;
  type: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  // Environment variables with sensitive names
  {
    pattern: /export\s+(\w*(KEY|SECRET|TOKEN|PASSWORD|PASS|PWD|CREDENTIAL|AUTH)\w*)\s*=\s*['"]?([^\s'"]+)/i,
    type: 'Environment Variable',
  },

  // Authorization headers
  {
    pattern: /Authorization:\s*(Bearer|Basic)\s+([A-Za-z0-9+/=._-]{10,})/i,
    type: 'Auth Header',
  },

  // curl with -u credentials
  {
    pattern: /curl\s+.*-u\s+(\w+):([^\s]+)/i,
    type: 'curl Credentials',
  },

  // Database connection strings with passwords
  {
    pattern: /(mysql|psql|postgres|mongo|redis|mongodb):\/\/([^:]+):([^@]+)@/i,
    type: 'Database URL',
  },

  // AWS Access Key ID
  {
    pattern: /AWS_ACCESS_KEY_ID\s*=\s*(AK[A-Z0-9]{18,})/i,
    type: 'AWS Access Key',
  },

  // AWS Secret Access Key
  {
    pattern: /AWS_SECRET_ACCESS_KEY\s*=\s*([A-Za-z0-9+/]{38,})/i,
    type: 'AWS Secret Key',
  },

  // Generic API keys (long alphanumeric after common key names)
  {
    pattern: /[_-]?(api[_-]?key|apikey|api_secret|secret_key)\s*[=:]\s*['"]?([A-Za-z0-9_-]{20,})/i,
    type: 'API Key',
  },

  // GitHub personal access tokens
  {
    pattern: /(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/i,
    type: 'GitHub Token',
  },

  // GitLab tokens
  {
    pattern: /(glpat-[A-Za-z0-9\-]{20,})/i,
    type: 'GitLab Token',
  },

  // Slack tokens
  {
    pattern: /(xox[baprs]-[A-Za-z0-9-]+)/i,
    type: 'Slack Token',
  },

  // Private key content
  {
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i,
    type: 'Private Key',
  },

  // Heroku API key
  {
    pattern: /HEROKU_API_KEY\s*=\s*([A-Za-z0-9-]{36,})/i,
    type: 'Heroku API Key',
  },

  // Stripe keys
  {
    pattern: /(sk_live_[A-Za-z0-9]{24,}|rk_live_[A-Za-z0-9]{24,})/i,
    type: 'Stripe Key',
  },

  // SendGrid API key
  {
    pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/i,
    type: 'SendGrid API Key',
  },

  // JWT tokens (very long base64-ish strings)
  {
    pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/i,
    type: 'JWT Token',
  },

  // npm tokens
  {
    pattern: /npm_[A-Za-z0-9]{36}/i,
    type: 'npm Token',
  },
];

/**
 * Redact the secret value from a command
 */
function redactCommand(command: string, type: string): string {
  // Specific redaction patterns for each secret type
  const redactionPatterns: Record<string, RegExp> = {
    'GitHub Token': /(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/gi,
    'GitLab Token': /(glpat-[A-Za-z0-9\-]{20,})/gi,
    'Slack Token': /(xox[baprs]-[A-Za-z0-9-]+)/gi,
    'AWS Access Key': /(AK[A-Z0-9]{18,})/gi,
    'AWS Secret Key': /AWS_SECRET_ACCESS_KEY\s*=\s*([A-Za-z0-9+/]{38,})/gi,
    'Stripe Key': /(sk_live_[A-Za-z0-9]{24,}|rk_live_[A-Za-z0-9]{24,})/gi,
    'SendGrid API Key': /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/gi,
    'JWT Token': /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/gi,
    'npm Token': /npm_[A-Za-z0-9]{36}/gi,
    'Heroku API Key': /HEROKU_API_KEY\s*=\s*([A-Za-z0-9-]{36,})/gi,
    'Auth Header': /(Bearer|Basic)\s+([A-Za-z0-9+/=._-]{10,})/gi,
    'curl Credentials': /-u\s+(\w+):([^\s]+)/gi,
    'Database URL': /:\/\/([^:]+):([^@]+)@/gi,
    'API Key': /[_-]?(api[_-]?key|apikey|api_secret|secret_key)\s*[=:]\s*['"]?([A-Za-z0-9_-]{20,})/gi,
    'Environment Variable': /export\s+(\w*(?:KEY|SECRET|TOKEN|PASSWORD|PASS|PWD|CREDENTIAL|AUTH)\w*)\s*=\s*['"]?([^\s'"]+)/gi,
    'Private Key': /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
  };

  const pattern = redactionPatterns[type];
  if (pattern) {
    return command.replace(pattern, '[REDACTED]');
  }

  // Fallback: redact any long alphanumeric strings after = or :
  return command.replace(/([=:\s])(['"]?)([A-Za-z0-9+/=._-]{20,})\2/g, '$1$2[REDACTED]$2');
}

/**
 * Aggregate secrets found in command history
 */
export function aggregateSecrets(events: CommandEvent[]): SecretsStats {
  const secretMatches: SecretMatch[] = [];
  const seenCommands = new Set<string>(); // Avoid duplicate entries
  const typeCounts = new Map<string, number>();

  for (const event of events) {
    const command = event.command;

    // Skip if we've already processed this exact command
    if (seenCommands.has(command)) {
      continue;
    }

    for (const { pattern, type } of SECRET_PATTERNS) {
      if (pattern.test(command)) {
        seenCommands.add(command);

        // Increment type count
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

        // Add to matches (limit to avoid huge output)
        if (secretMatches.length < 50) {
          secretMatches.push({
            type,
            redactedCommand: redactCommand(command, type),
            originalCommand: command,
          });
        }

        // Only count first match per command
        break;
      }
    }
  }

  // Format type counts
  const secretTypes = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    potentialSecrets: secretMatches,
    totalSecretsFound: secretMatches.length,
    secretTypes,
  };
}
