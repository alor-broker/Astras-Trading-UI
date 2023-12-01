import { Observable } from "rxjs";
import { OpPatch } from "json-patch";
import { ApplyOptions } from "./models/migration.model";

export abstract class MigrationBase {
  // Unique Id to check that migration has been already applied
  abstract get migrationId(): string;
  // Options to check if migration is applicable
  abstract get applyOptions(): ApplyOptions;

  abstract getPatches(current: unknown): Observable<OpPatch[]>;
}
