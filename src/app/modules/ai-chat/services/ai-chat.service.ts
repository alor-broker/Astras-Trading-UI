import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  NewMessageRequest,
  ReplyResponse
} from "../models/messages-http.model";
import {
  Observable,
  take
} from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";
import { EnvironmentService } from "../../../shared/services/environment.service";

interface PostMessageResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly baseUrl = `${this.environmentService.apiUrl}/aichat`;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly environmentService: EnvironmentService
  ) {

  }

  sendMessage(message: NewMessageRequest): Observable<ReplyResponse | null> {
    return this.httpClient.post<PostMessageResponse>(
      `${this.baseUrl}/messages`,
      {
        threadId: 0,
        sender: 'astras-ai-chart@mock.com',
        text: message.text
      }
    ).pipe(
      catchHttpError<PostMessageResponse | null>(null, this.errorHandlerService),
      map(r => {
        if (!r) {
          return null;
        }

        return {
          text: r.answer
        } as ReplyResponse;
      }),
      take(1)
    );
  }
}
