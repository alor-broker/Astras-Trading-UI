import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { AllInstruments } from "../model/all-instruments.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

@Injectable({
  providedIn: 'root'
})
export class AllInstrumentsService {
  private baseUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {}

  getAllInstruments(filters: any): Observable<Array<AllInstruments>> {
    return this.http.get<Array<AllInstruments>>(this.baseUrl + '/advanced', {
      params: filters
    })
      .pipe(
        catchHttpError<Array<AllInstruments>>([], this.errorHandlerService)
      );
  }
}
