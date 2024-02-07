import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { AllInstruments, AllInstrumentsFilters } from "../model/all-instruments.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

@Injectable({
  providedIn: 'root'
})
export class AllInstrumentsService {
  private readonly baseUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {}

  getAllInstruments(filters: AllInstrumentsFilters): Observable<AllInstruments[] | null> {
    return this.http.get<AllInstruments[]>(this.baseUrl + '/advanced', {
      params: { ...filters }
    })
      .pipe(
        catchHttpError<AllInstruments[] | null>(null, this.errorHandlerService)
      );
  }
}
