import {
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import { MigrationBase } from "./migration-base";
import {
  filter,
  map
} from "rxjs/operators";
import { mapWith } from "../../shared/utils/observable-helper";
import { apply } from "json-patch";
import {
  ApplyStrategyType,
  MigrationMeta
} from "./models/migration.model";

interface MigrationResult<T> {
  updatedData: T;
  appliedMigrations: string[];
}

export abstract class MigrationManagerBase {
  protected abstract get migrations(): MigrationBase[];

  applyMigrations<R>(
    input: unknown,
    saveCallback: (migrated: R) => Observable<boolean>
  ): Observable<MigrationResult<R>> {
    if (input == null) {
      return of({
        updatedData: input as R,
        appliedMigrations: []
      });
    }

    return this.getAppliedMigrations().pipe(
      map(m => this.getMigrationsToApply(m)),
      switchMap(migrations => this.getMigrationsStream<R>(migrations, input)),
      switchMap(result => this.commitMigrations(result, saveCallback)),
      take(1),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  protected abstract saveAppliedMigrations(migrations: string[]): Observable<boolean>;

  protected abstract getAppliedMigrations(): Observable<MigrationMeta[]>;

  private getMigrationsToApply(appliedMigrations: MigrationMeta[]): MigrationBase[] {
    const migrationsToApply: MigrationBase[] = [];
    for (const migration of this.migrations) {
      if (migration.applyOptions.strategy === ApplyStrategyType.ApplyOnce) {
        if (migration.applyOptions.expirationDate != null && migration.applyOptions.expirationDate.getTime() < Date.now()) {
          console.warn(`${migration.migrationId} is expired and can be removed`);
          continue;
        }

        if (appliedMigrations.find(x => x.id === migration.migrationId) == null) {
          migrationsToApply.push(migration);
        }
      }
    }

    return migrationsToApply;
  }

  private getMigrationsStream<R>(migrations: MigrationBase[], input: unknown): Observable<MigrationResult<R>> {
    let resultSequence$ = of({
      updatedData: input,
      appliedMigrations: []
    } as MigrationResult<R>);

    for (const migration of migrations) {
      resultSequence$ = resultSequence$.pipe(
        mapWith(
          x => migration.getPatches(x.updatedData),
          (current, patches) => ({ current, patches, migrationId: migration.migrationId })
        ),
        map(x => {
          if (x.patches.length === 0) {
            return x.current;
          }

          const updated = apply(JSON.parse(JSON.stringify(x.current.updatedData)), x.patches) as R;

          const newResult: MigrationResult<R> = {
            updatedData: updated,
            appliedMigrations: [...x.current.appliedMigrations, x.migrationId]
          };

          return newResult;
        }),
        take(1)
      );
    }

    return resultSequence$;
  }

  private commitMigrations<R>(result: MigrationResult<R>, saveCallback: (migrated: R) => Observable<boolean>): Observable<MigrationResult<R>> {
    if (result.appliedMigrations.length > 0) {
      return saveCallback(result.updatedData).pipe(
        filter(x => x),
        switchMap(() => this.saveAppliedMigrations(result.appliedMigrations)),
        filter(x => x),
        map(() => result),
        take(1)
      );
    }

    return of(result);
  }
}
