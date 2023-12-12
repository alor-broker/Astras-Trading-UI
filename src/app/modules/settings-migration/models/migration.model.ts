export interface MigrationMeta {
  id: string;
}

export interface ApplyOptions {
  strategy: ApplyStrategyType;
  expirationDate: Date | null;
}

export enum ApplyStrategyType {
  ApplyOnce = 'apply-once'
}
