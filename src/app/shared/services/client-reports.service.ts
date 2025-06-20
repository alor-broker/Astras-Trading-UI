import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { EnvironmentService } from "./environment.service";
import { Observable } from "rxjs";
import { catchHttpError } from "../utils/observable-helper";
import { map } from "rxjs/operators";
import {
  format,
  parse
} from 'date-fns';
import { ErrorHandlerService } from "./handle-error/error-handler.service";

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
  reportDate: Date;
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

interface AvailableReportsResponse {
  list: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientReportsService {
  private readonly baseUrl = this.environmentService.clientDataUrl + '/client/v1.0';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
  ) {

  }

  getAvailableReports(
    agreement: string,
    market: ReportMarket,
    timeRange: ReportTimeRange,
    limit = 10,
    fromDate?: Date
  ): Observable<ClientReportId[] | null> {
    const params: {
      market: ReportMarket;
      timeRange: ReportTimeRange;
      dateFrom?: string;
    } = {
      market,
      timeRange
    };

    if (fromDate != null) {
      params.dateFrom = format(fromDate, 'yyyy-MM-dd');
    }

    return this.httpClient.get<AvailableReportsResponse>(
      `${this.baseUrl}/agreements/${agreement}/reports`,
      {
        params
      }
    ).pipe(
      catchHttpError<AvailableReportsResponse | null>(null, this.errorHandlerService),
      map(r => {
        if (r == null) {
          return null;
        }

        const dateParseFormat = timeRange === ReportTimeRange.Daily
          ? 'yyyyMMdd'
          : 'yyyyMM';

        return r.list.map(i => ({
          id: i,
          timeRange,
          market,
          reportDate: parse(
            i,
            dateParseFormat,
            new Date()
          )
        }))
          .slice(-limit)
          .reverse();
      })
    );
  }

  getReport(
    agreement: string,
    market: ReportMarket,
    id: string
  ): Observable<ClientReport | null> {
    return this.httpClient.get<ClientReport>(`${this.baseUrl}/agreements/${agreement}/report/${market}/${id}`).pipe(
      catchHttpError<ClientReport | null>(null, this.errorHandlerService)
    );
  }
}
