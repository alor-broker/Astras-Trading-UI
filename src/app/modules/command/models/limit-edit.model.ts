import { LimitCommand } from "./limit-command.model";

export interface LimitEdit extends Omit<LimitCommand, 'side'> {
  id: string
}
