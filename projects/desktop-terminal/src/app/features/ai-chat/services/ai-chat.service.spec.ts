import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom, of} from 'rxjs';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {LoggerService} from '@terminal-core-lib/features/logging/services/logger-service';
import {TerminalSettingsServiceMock} from '@testing-lib/angular/terminal-settings-service.mock';
import {EnvironmentService} from '../../../services/environment.service';
import {AiChatErrorCode} from './ai-chat-service.types';
import {AiChatService} from './ai-chat.service';

describe('AiChatService', () => {
  let service: AiChatService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: EnvironmentService, useValue: {apiUrl: 'https://api.example.test'}},
        {
          provide: DesktopDashboardContextService,
          useValue: {selectedDashboard$: of({items: []})}
        },
        TerminalSettingsServiceMock.create().provider,
        {provide: LoggerService, useValue: {error: vi.fn()}}
      ]
    });
    service = TestBed.inject(AiChatService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should return the answer for a successful message', async () => {
    const message = {threadId: 'conversation', text: 'Hello'};

    const result = firstValueFrom(service.sendMessage(message));
    const request = httpTesting.expectOne(req => req.url.endsWith('/aichat/messages'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(expect.objectContaining(message));
    request.flush({answer: 'Reply'});

    await expect(result).resolves.toEqual({text: 'Reply'});
  });

  it('should expose a context limit error by its API code', async () => {
    const result = firstValueFrom(service.sendMessage({threadId: 'conversation', text: 'Hello'}));

    httpTesting.expectOne(req => req.url.endsWith('/aichat/messages')).flush(
      {code: 'context_too_large', error: 'The context is too large.'},
      {status: 422, statusText: 'Unprocessable Entity'}
    );

    await expect(result).resolves.toEqual({errorCode: AiChatErrorCode.ContextTooLarge});
  });

  it.each([
    {code: 'validation_failed', error: 'Invalid request parameters.'},
    {code: 'unknown_code', error: 'Unknown error.'},
    {error: 'context_too_large'},
    {code: null},
    {code: 422},
    {},
    null,
    'context_too_large'
  ])('should keep the generic fallback for an unrecognized HTTP 422 body %j', async body => {
    const result = firstValueFrom(service.sendMessage({threadId: 'conversation', text: 'Hello'}));

    httpTesting.expectOne(req => req.url.endsWith('/aichat/messages')).flush(
      body,
      {status: 422, statusText: 'Unprocessable Entity'}
    );

    await expect(result).resolves.toBeNull();
  });

  it('should keep the generic fallback when context compression fails', async () => {
    const result = firstValueFrom(service.sendMessage({threadId: 'conversation', text: 'Hello'}));

    httpTesting.expectOne(req => req.url.endsWith('/aichat/messages')).flush(
      {code: 'context_compaction_failed', error: 'The conversation context could not be compressed.'},
      {status: 502, statusText: 'Bad Gateway'}
    );

    await expect(result).resolves.toBeNull();
  });
});
