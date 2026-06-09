export enum ContourState {
  Active = 'active',
  Inactive = 'inactive'
}

export enum ContourErrorCode {
  ContourSwitchDisabled = 'ContourSwitchDisabled',
  ContourStateUnavailable = 'ContourStateUnavailable',
  ContourProjectionUnavailable = 'ContourProjectionUnavailable',
  SwitchCooldown = 'SwitchCooldown'
}

export interface ContourStatusResponse {
  state: ContourState;
}

export interface ContourErrorResponse {
  code: ContourErrorCode;
  message: string | null;
}

export interface SwitchCooldownErrorResponse extends ContourErrorResponse {
  code: ContourErrorCode.SwitchCooldown;
  retryAfterSec: number;
}

export enum ContourActivationResultStatus {
  Success = 'success',
  Error = 'error'
}

export type ContourActivationResult =
  | {
    status: ContourActivationResultStatus.Success;
    response: ContourStatusResponse;
  }
  | {
    status: ContourActivationResultStatus.Error;
    error: ContourErrorResponse | SwitchCooldownErrorResponse | null;
  };
