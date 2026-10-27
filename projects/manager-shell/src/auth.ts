import {isRecord} from './config';
import {Failure, type ClientEntry, type Identity} from './contracts';
import {AuthReason, AuthStage, type AuthDiagnostic} from './auth-diagnostics';

export class AuthError extends Error {
  constructor(readonly failure: Failure, readonly reason = AuthReason.InvalidResponse) {
    super(failure);
  }
}

export function validateIdentity(value: unknown, client: ClientEntry, now = Date.now()): Identity {
  if (!isRecord(value) || typeof value.jwt !== 'string' || value.jwt.length > 65536) {
    throw new AuthError(Failure.Authentication, AuthReason.InvalidResponse);
  }
  // The private endpoint and existing terminal use reusable tokens. Fail closed if
  // a future response signals rotation rather than silently discarding the new token.
  if ('refreshToken' in value && value.refreshToken !== client.refreshToken) {
    throw new AuthError(Failure.Authentication, AuthReason.RotatedToken);
  }
  const parts = value.jwt.split('.');
  if (parts.length !== 3 || !parts[1]) throw new AuthError(Failure.Authentication, AuthReason.MalformedJwt);
  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as unknown;
  } catch {
    throw new AuthError(Failure.Authentication, AuthReason.MalformedJwt);
  }
  if (!isRecord(claims) || claims.clientid !== client.clientId) throw new AuthError(Failure.Identity, AuthReason.ClientMismatch);
  if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp * 1000 <= now) {
    throw new AuthError(Failure.Authentication, AuthReason.ExpiredJwt);
  }
  return {jwt: value.jwt, refreshToken: client.refreshToken};
}

export async function authenticate(
  baseUrl: string,
  client: ClientEntry,
  signal: AbortSignal,
  request: (url: string, init: RequestInit) => Promise<Response> = fetch,
  report?: (diagnostic: AuthDiagnostic) => void
): Promise<Identity> {
  const url = `${baseUrl}/auth/actions/refresh`;
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  try {
    report?.({stage: AuthStage.Request, url});
    const response = await request(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({refreshToken: client.refreshToken}),
      credentials: 'omit',
      redirect: 'error',
      signal: requestSignal
    });
    report?.({stage: AuthStage.Response, url, status: response.status});
    if (!response.ok) throw new AuthError(Failure.Authentication, AuthReason.HttpError);
    if (response.body === null) throw new AuthError(Failure.Authentication, AuthReason.EmptyResponse);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        length += result.value.length;
        if (length > 131072) throw new AuthError(Failure.Authentication, AuthReason.OversizedResponse);
        chunks.push(result.value);
      }
    } finally {
      await reader.cancel();
    }
    let value: unknown;
    try {
      value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    } catch {
      throw new AuthError(Failure.Authentication, AuthReason.InvalidJson);
    }
    const identity = validateIdentity(value, client);
    report?.({stage: AuthStage.Ready, url});
    return identity;
  } catch (error: unknown) {
    const reason = error instanceof AuthError ? error.reason
      : signal.aborted ? AuthReason.Cancelled
        : requestSignal.aborted ? AuthReason.Timeout : AuthReason.Network;
    // Extract only Chromium's fixed error code, never an arbitrary error message.
    const networkCode = error instanceof Error ? /\bnet::ERR_[A-Z0-9_]+\b/u.exec(error.message)?.[0] : undefined;
    report?.({stage: AuthStage.Failed, url, reason, ...(networkCode ? {networkCode} : {})});
    throw error instanceof AuthError ? error : new AuthError(Failure.Authentication, reason);
  }
}
