import crypto from 'crypto';

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function rnd() {
  return crypto.randomBytes(8).toString('hex');
}

export function readHashFromBody(body?: string | null) {
  if (!body) {
    return undefined;
  }

  const re = /<!-- BEGIN SHA linux-x64 -->([0-9a-f]+)<!-- END SHA linux-x64 -->/;
  if (re.test(body)) {
    const matches = body.match(re);
    if (matches && matches.length > 1) {
      return matches[1];
    }
  }
  return undefined;
}
