import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  NewMessageRequest,
  ReplyResponse
} from "../models/messages-http.model";
import {
  Observable,
  switchMap,
  timer
} from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";
import { HttpContextTokens } from "../../../shared/constants/http.constants";

interface MessageMock {
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {

  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendMessage(message: NewMessageRequest): Observable<ReplyResponse | null> {
    return timer(Math.round(Math.random() * 10_000)).pipe(
      switchMap(() => this.httpClient.get<MessageMock>(
        'https://fish-text.ru/get',
        {
          params: {
            type: 'sentence',
            number: Math.min(Math.round(Math.random() * 10), 5)
          },
          context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
        }
      )),
      catchHttpError<MessageMock | null>(null, this.errorHandlerService),
      map(r => {
        if (!r) {
          return null;
        }

        return {
          text: r.text
        } as ReplyResponse;
      })
    );
  }
}
