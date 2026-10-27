export enum AuthStage {
  Request = 'request',
  Response = 'response',
  Ready = 'ready',
  Failed = 'failed'
}

export enum AuthReason {
  InvalidResponse = 'invalid-response',
  RotatedToken = 'refresh-token-rotation-not-supported',
  MalformedJwt = 'malformed-jwt',
  ClientMismatch = 'client-id-mismatch',
  ExpiredJwt = 'expired-or-invalid-jwt-expiry',
  HttpError = 'http-error',
  EmptyResponse = 'empty-response',
  OversizedResponse = 'response-too-large',
  InvalidJson = 'invalid-json-response',
  Network = 'network-error',
  Timeout = 'timeout',
  Cancelled = 'cancelled'
}

/** Deliberately excludes request/response bodies, headers and credentials. */
export interface AuthDiagnostic {
  stage: AuthStage;
  url: string;
  status?: number;
  reason?: AuthReason;
  networkCode?: string;
}
