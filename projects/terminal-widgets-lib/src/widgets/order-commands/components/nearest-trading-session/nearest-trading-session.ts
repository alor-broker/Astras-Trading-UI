import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
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
import {FinancialAttributesSchema} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas';
import {
  Modify,
  ZodPropertiesOf
} from '@terminal-core-lib/features/graphql/utils/zod-types.helper';
import {
  Exchange,
  Instrument,
  InstrumentModelFilterInput,
  InstrumentsConnection,
  Query,
  QueryInstrumentsArgs
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  FetchPolicy,
  GraphQlService
} from '@terminal-core-lib/features/graphql/services/graph-ql.service';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {
  TerminalSettings,
  TimezoneDisplayOption
} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';

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
  templateUrl: './nearest-trading-session.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
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
