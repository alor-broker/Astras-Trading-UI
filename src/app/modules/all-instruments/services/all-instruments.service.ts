import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { AllInstruments } from "../model/all-instruments.model";

@Injectable({
  providedIn: 'root'
})
export class AllInstrumentsService {
  private baseUrl = environment.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly http: HttpClient
  ) {}

  getAllInstruments(filters: any): Observable<Array<AllInstruments>> {
    return this.http.get<Array<AllInstruments>>(this.baseUrl + '/advanced', {
      params: filters
    });
  }
}
