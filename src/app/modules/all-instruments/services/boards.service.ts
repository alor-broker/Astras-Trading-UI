import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { Board } from "../model/boards.model";

@Injectable({
  providedIn: 'root'
})
export class BoardsService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly url = this.environmentService.apiUrl + '/md/v2/boards';

  getAllBoards(): Observable<Board[] | null> {
    return this.http.get<Board[]>(this.url)
      .pipe(
        catchHttpError<Board[] | null>(null, this.errorHandlerService),
      );
  }
}
