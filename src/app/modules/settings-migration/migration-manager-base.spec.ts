import { MigrationManagerBase } from "./migration-manager-base";
import { MigrationBase } from "./migration-base";
import {
  Observable,
  of,
  take
} from "rxjs";
import {
  ApplyStrategyType,
  MigrationMeta
} from "./models/migration.model";
import { TestBed } from "@angular/core/testing";
import { AddPatch } from "json-patch";

class MigrationManagerTest extends MigrationManagerBase {
  availableMigrations: MigrationBase[] = [];
  appliedMigrations: MigrationMeta[] = [];

  protected get migrations(): MigrationBase[] {
    return this.availableMigrations;
  }

  protected getAppliedMigrations(): Observable<MigrationMeta[]> {
    return of(this.appliedMigrations);
  }

  protected saveAppliedMigrations(migrations: string[]): Observable<boolean> {
    return of(true);
  }

}

describe('MigrationManagerBase', () => {
  let manager: MigrationManagerTest;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    manager = new MigrationManagerTest();
  });

  it('should be created', () => {
    expect(manager).toBeTruthy();
  });

  describe('ApplyOnce migrations', () => {

    it('should run valid migration', () => {
      const migration1Id = 'test1';
      const migration2Id = 'test2';
      const notExpiredDate = new Date();
      notExpiredDate.setMonth(notExpiredDate.getMonth() + 1);

      manager.availableMigrations = [
        {
          migrationId: migration1Id,
          applyOptions: {
            strategy: ApplyStrategyType.ApplyOnce,
            expirationDate: null
          },
          getPatches: current => {
            return of([{
              op: 'add',
              path: '/test',
              value: '0'
            } as AddPatch
            ]);
          }
        },
        {
          migrationId: migration2Id,
          applyOptions: {
            strategy: ApplyStrategyType.ApplyOnce,
            expirationDate: notExpiredDate
          },
          getPatches: current => {
            return of([{
              op: 'add',
              path: '/test',
              value: '0'
            } as AddPatch
            ]);
          }
        }
      ];

      manager.applyMigrations<any>({}, migrated => of(true)).pipe(
        take(1)
      ).subscribe(x => {
        expect(x.appliedMigrations).toEqual([migration1Id, migration2Id]);
      });
    });

    it('should ignore applied migration', () => {
      const migration1Id = 'test1';
      const migration2Id = 'test2';
      const notExpiredDate = new Date();
      notExpiredDate.setMonth(notExpiredDate.getMonth() + 1);

      manager.availableMigrations = [
        {
          migrationId: migration1Id,
          applyOptions: {
            strategy: ApplyStrategyType.ApplyOnce,
            expirationDate: null
          },
          getPatches: current => {
            return of([{
              op: 'add',
              path: '/test',
              value: '0'
            } as AddPatch
            ]);
          }
        },
        {
          migrationId: migration2Id,
          applyOptions: {
            strategy: ApplyStrategyType.ApplyOnce,
            expirationDate: notExpiredDate
          },
          getPatches: current => {
            return of([{
              op: 'add',
              path: '/test',
              value: '0'
            } as AddPatch
            ]);
          }
        }
      ];

      manager.appliedMigrations = [{ id: migration1Id }];

      manager.applyMigrations<any>({}, migrated => of(true)).pipe(
        take(1)
      ).subscribe(x => {
        expect(x.appliedMigrations).toEqual([migration2Id]);
      });
    });

    it('should ignore expired migration', () => {
      const migration1Id = 'test1';
      const migration2Id = 'test2';
      const notExpiredDate = new Date();
      notExpiredDate.setMonth(notExpiredDate.getMonth() - 1);

      manager.availableMigrations = [
        {
          migrationId: migration1Id,
          applyOptions: {
            strategy: ApplyStrategyType.ApplyOnce,
            expirationDate: null
          },
          getPatches: current => {
            return of([{
              op: 'add',
              path: '/test',
              value: '0'
            } as AddPatch
            ]);
          }
        },
        {
          migrationId: migration2Id,
          applyOptions: {
            strategy: ApplyStrategyType.ApplyOnce,
            expirationDate: notExpiredDate
          },
          getPatches: current => {
            return of([{
              op: 'add',
              path: '/test',
              value: '0'
            } as AddPatch
            ]);
          }
        }
      ];

      manager.applyMigrations<any>({}, migrated => of(true)).pipe(
        take(1)
      ).subscribe(x => {
        expect(x.appliedMigrations).toEqual([migration1Id]);
      });
    });
  });
});
