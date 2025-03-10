import {OutputFormat} from "../graph/nodes/models";

export interface GraphResult {
  format: OutputFormat;
  source: string;
  result: unknown;
}

export enum Status {
  Initial = 'initial',
  Loading = 'loading',
  Error = 'error',
  Success = 'success'
}

export interface RunStatus {
  status: Status;
  results: GraphResult[];
}
