import { Injectable } from '@angular/core';
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
  private readonly url = this.environmentService.apiUrl + '/md/v2/boards';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

  getAllBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.url)
      .pipe(
        catchHttpError<Board[]>([], this.errorHandlerService),
      );
  }
}
