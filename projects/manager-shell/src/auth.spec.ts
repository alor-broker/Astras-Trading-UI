import {afterEach, describe, expect, it, vi} from 'vitest';
import {ManagerConfigFixtures} from '@testing-lib/fixtures/manager-config';
import {authenticate, validateIdentity} from './auth';
import {Failure} from './contracts';
import {AuthReason, AuthStage} from './auth-diagnostics';

describe('Client authentication', () => {
  const now = 1800000000000;
  const client = ManagerConfigFixtures.createConfig().clients[0]!;
  const token = (clientId: string, exp = now / 1000 + 300): string =>
    `header.${Buffer.from(JSON.stringify({clientid: clientId, exp})).toString('base64url')}.signature`;

  afterEach(() => vi.useRealTimers());

  it('should reject credentials labeled with the wrong client identity', () => {
    expect(() => validateIdentity({jwt: token('client-b')}, client, now)).toThrow(Failure.Identity);
  });

  it('should reject expired tokens', () => {
    expect(() => validateIdentity({jwt: token(client.clientId, now / 1000)}, client, now)).toThrow(Failure.Authentication);
  });

  it('should fail closed when the endpoint starts rotating refresh tokens', () => {
    expect(() => validateIdentity({jwt: token(client.clientId), refreshToken: 'rotated'}, client, now)).toThrow(Failure.Authentication);
  });

  it.each([null, {}, {jwt: 'broken'}, {jwt: 'a.invalid-json.b'}])('should reject malformed responses', value => {
    expect(() => validateIdentity(value, client, now)).toThrow(Failure.Authentication);
  });

  it('should send only the selected token and reject redirects', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const jwt = token(client.clientId);
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({jwt})));

    const identity = await authenticate('https://identity.example.com', client, new AbortController().signal, request);

    expect(identity).toEqual({jwt, refreshToken: client.refreshToken});
    expect(request).toHaveBeenCalledWith('https://identity.example.com/auth/actions/refresh', expect.objectContaining({
      method: 'POST', redirect: 'error', credentials: 'omit', body: JSON.stringify({refreshToken: client.refreshToken})
    }));
  });

  it('should suppress HTTP response details', async () => {
    const request = vi.fn().mockResolvedValue(new Response('sensitive backend details', {status: 401}));

    await expect(authenticate('https://identity.example.com', client, new AbortController().signal, request))
      .rejects.toThrow(Failure.Authentication);
  });

  it('should report the HTTP status without exposing credentials or backend response bodies', async () => {
    const request = vi.fn().mockResolvedValue(new Response(`secret response ${client.refreshToken}`, {status: 401}));
    const report = vi.fn();

    await expect(authenticate('https://identity.example.com', client, new AbortController().signal, request, report))
      .rejects.toThrow(Failure.Authentication);

    expect(report).toHaveBeenCalledWith({stage: AuthStage.Response, url: 'https://identity.example.com/auth/actions/refresh', status: 401});
    expect(report).toHaveBeenLastCalledWith({stage: AuthStage.Failed, url: 'https://identity.example.com/auth/actions/refresh', reason: AuthReason.HttpError});
    expect(JSON.stringify(report.mock.calls)).not.toContain(client.refreshToken);
    expect(JSON.stringify(report.mock.calls)).not.toContain('secret response');
  });

  it('should report only the Chromium network code from errors that could contain secrets', async () => {
    const request = vi.fn().mockRejectedValue(new Error(`net::ERR_CERT_AUTHORITY_INVALID token=${client.refreshToken}`));
    const report = vi.fn();

    await expect(authenticate('https://identity.example.com', client, new AbortController().signal, request, report))
      .rejects.toThrow(Failure.Authentication);

    expect(report).toHaveBeenLastCalledWith(expect.objectContaining({reason: AuthReason.Network, networkCode: 'net::ERR_CERT_AUTHORITY_INVALID'}));
    expect(JSON.stringify(report.mock.calls)).not.toContain(client.refreshToken);
  });

  it('should distinguish invalid JSON from an HTTP failure without logging the response', async () => {
    const request = vi.fn().mockResolvedValue(new Response('sensitive invalid JSON'));
    const report = vi.fn();

    await expect(authenticate('https://identity.example.com', client, new AbortController().signal, request, report))
      .rejects.toThrow(Failure.Authentication);

    expect(report).toHaveBeenLastCalledWith(expect.objectContaining({reason: AuthReason.InvalidJson}));
    expect(JSON.stringify(report.mock.calls)).not.toContain('sensitive invalid JSON');
  });

  it('should pass cancellation through to the request', async () => {
    const controller = new AbortController();
    controller.abort();
    const request = vi.fn((_url: string, init: RequestInit): Promise<Response> => {
      expect(init.signal?.aborted).toBe(true);
      return Promise.reject(new Error('Aborted'));
    });

    await expect(authenticate('https://identity.example.com', client, controller.signal, request))
      .rejects.toThrow(Failure.Authentication);
  });
});
