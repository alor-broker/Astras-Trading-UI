import {Observable} from 'rxjs';
import {OpPatch} from "json-patch";

export interface MigrationMeta {
  id: string;
}

export interface ApplyOptions {
  strategy: ApplyStrategyType;
  expirationDate: Date | null;
}

export enum ApplyStrategyType {
  ApplyOnce = 'apply-once',
  Other = 'other'
}

export abstract class MigrationBase {
  // Unique Id to check that migration has been already applied
  abstract get migrationId(): string;

  // Options to check if migration is applicable
  abstract get applyOptions(): ApplyOptions;

  abstract getPatches(current: unknown): Observable<OpPatch[]>;
}

export interface MigrationResult<T> {
  updatedData: T;
  appliedMigrations: string[];
}
