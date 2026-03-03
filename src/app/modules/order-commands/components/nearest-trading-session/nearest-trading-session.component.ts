import {
  Component,
  inject,
  input
} from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {
  FetchPolicy,
  GraphQlService
} from "../../../../shared/services/graph-ql.service";
import {FinancialAttributesSchema} from "../../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../../shared/utils/graph-ql/zod-helper";
import {
  Exchange,
  Instrument,
  InstrumentModelFilterInput,
  InstrumentsConnection,
  Query,
  QueryInstrumentsArgs
} from "../../../../../generated/graphql.types";
import {
  object,
  TypeOf,
  ZodObject
} from "zod/v3";
import {toObservable} from "@angular/core/rxjs-interop";
import {
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import {
  closestTo,
  isFuture,
  isPast,
  parseISO
} from "date-fns";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {TerminalSettings} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {TimezoneDisplayOption} from "../../../../shared/models/enums/timezone-display-option";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {TZDate} from "@date-fns/tz";
import {
  combineLatest,
  filter,
  timer
} from "rxjs";
import {
  AsyncPipe,
  DatePipe
} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";

const TradingPeriodsSchema = FinancialAttributesSchema().pick({
  tradingPeriods: true
});

type InstrumentInfoType = Modify<
  Instrument,
  'financialAttributes',
  {
    financialAttributes: TypeOf<typeof TradingPeriodsSchema>;
  }
>;

const InstrumentInfoScheme: ZodObject<ZodPropertiesOf<InstrumentInfoType>> = object({
  financialAttributes: TradingPeriodsSchema
});

type InstrumentsConnectionType = Modify<
  InstrumentsConnection,
  'nodes',
  {
    nodes: TypeOf<typeof InstrumentInfoScheme>[];
  }
>;

const InstrumentsConnectionScheme: ZodObject<ZodPropertiesOf<InstrumentsConnectionType>> = object({
  nodes: InstrumentInfoScheme.array()
});

type InstrumentsSearchQueryType = Modify<
  Query,
  'instruments',
  {
    instruments: TypeOf<typeof InstrumentsConnectionScheme>;
  }
>;

export const InstrumentTradingResponseScheme: ZodObject<ZodPropertiesOf<InstrumentsSearchQueryType>> = object({
  instruments: InstrumentsConnectionScheme
});

export type InstrumentTradingResponse = TypeOf<typeof InstrumentTradingResponseScheme>;

@Component({
  selector: 'ats-nearest-trading-session',
  imports: [
    AsyncPipe,
    DatePipe,
    TranslocoDirective
  ],
  templateUrl: './nearest-trading-session.component.html',
  styleUrl: './nearest-trading-session.component.less',
})
export class NearestTradingSessionComponent {
  readonly instrumentKey = input.required<InstrumentKey>();

  readonly forceRefresh = input(true);

  private readonly graphQlService = inject(GraphQlService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly timezone$ = this.terminalSettingsService.getSettings().pipe(
    map((s: TerminalSettings) => {
      return s.timezoneDisplayOption === TimezoneDisplayOption.MskTime
        ? 'Europe/Moscow'
        : null;
    }),
  );

  readonly tradingSessionInfo$ = combineLatest({
    instrumentKey: toObservable(this.instrumentKey),
    timer: timer(0, 30_000),
    forceRefresh: toObservable(this.forceRefresh)
      .pipe(
        filter(v => v),
        startWith(true)
      )
  })
    .pipe(
      map(x => x.instrumentKey),
      switchMap(instrument => {
        const where: InstrumentModelFilterInput = {
          basicInformation: {
            symbol: {
              eq: instrument.symbol
            },
            exchange: {
              eq: instrument.exchange as Exchange
            },
          }
        };

        if (instrument.instrumentGroup != null && instrument.instrumentGroup.length > 0) {
          where.boardInformation = {
            board: {
              eq: instrument.instrumentGroup
            }
          };
        }

        const args: QueryInstrumentsArgs = {
          first: 1,
          includeNonBaseBoards: true,
          where
        };

        return this.graphQlService.queryForSchema<InstrumentTradingResponse>(
          InstrumentTradingResponseScheme,
          {
            first: args.first,
            where: {value: args.where, type: 'InstrumentModelFilterInput'}
          },
          {fetchPolicy: FetchPolicy.NoCache}
        );
      }),
      map(r => {
        if (r == null || r.instruments == null || r.instruments.nodes.length === 0) {
          return null;
        }

        const periods = r.instruments.nodes[0].financialAttributes.tradingPeriods ?? [];

        if (periods.length === 0) {
          return null;
        }

        const currentPeriod = periods.find(period => {
          return (period.start == null || isPast(parseISO(period.start)))
            && (period.finish == null || isFuture(parseISO(period.finish)));
        });

        if (currentPeriod != null) {
          return {
            isTrading: true
          };
        }

        const nearestStart = closestTo(
          new Date(),
          periods.filter(p => p.start != null).map(p => parseISO(p.start!))
        );

        if (nearestStart == null) {
          return null;
        }

        return {
          isTrading: false,
          nearestStart
        };
      }),
      mapWith(
        () => this.timezone$,
        (r, timezone) => {
          if (r == null) {
            return null;
          }

          if (r.nearestStart == null || timezone == null) {
            return r;
          }

          return {
            ...r,
            nearestStart: new TZDate(r.nearestStart, timezone)
          };
        }
      )
    );
}
