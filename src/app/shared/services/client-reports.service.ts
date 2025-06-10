import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { HttpErrorHandler } from "./handle-error/http-error-handler";
import { EnvironmentService } from "./environment.service";
import { Observable } from "rxjs";
import { catchHttpError } from "../utils/observable-helper";
import { map } from "rxjs/operators";

export enum ReportTimeRange {
  Monthly = 'monthly',
  Daily = 'daily'
}

export enum ReportMarket {
  // stock/derivatives
  United = 'united',
  // currency
  Currency = 'currency'
}

export interface ClientReportId {
  id: string;
  timeRange: ReportTimeRange;
  market: ReportMarket;
}

export interface ReportField {
  colSpan: string;
  value: string;
}

export type ReportRow = ReportField[];

export interface ReportTable {
  header: string;
  rows: ReportRow[];
}

export interface ClientReport {
  reportDate: string;
  comment: string;
  contractDate: string;
  contractNumber: string;
  clientName: string;
  moneyMovements: ReportRow[];
  moneyParameters: ReportRow[];
  clearingInfo: ReportRow[];
  warning: string;
  tables: ReportTable[];
  marketsInfo: ReportRow[];
  balance: ReportRow[];
  papersAndTrades: ReportRow[];
  asset: ReportRow[];
  positions: ReportRow[];
  directorPosition: string;
  directorName: string;
  departamentManagerName: string;
  departamentManagerPosition: string;
  clientSignatureRemarks: string;
  clientSignatureName: string;
  clientSignatureResolution: string;
  additionalComments: string;
  signature: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientReportsService {
  private readonly baseUrl = this.environmentService.clientDataUrl + '/client/v1.0';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {

  }

  getAvailableReports(
    agreement: string,
    market: ReportMarket,
    timeRange: ReportTimeRange
  ): Observable<ClientReportId[] | null> {
    return this.httpClient.get<string[]>(
      `${this.baseUrl}/agreements/${agreement}/reports`,
      {
        params: {
          market,
          timeRange
        }
      }
    ).pipe(
      catchHttpError<string[] | null>(null, this.httpErrorHandler),
      map(r => {
        if (r == null) {
          return null;
        }

        return r.map(i => ({
          id: i,
          timeRange,
          market
        }));
      })
    );
  }

  getReport(
    agreement: string,
    market: ReportMarket,
    id: string
  ): Observable<ClientReport | null> {
    return this.httpClient.get<ClientReport>(`${this.baseUrl}/agreements/${agreement}/report/${market}/${id}`).pipe(
      catchHttpError<ClientReport | null>(null, this.httpErrorHandler)
    );
  }
}
