import { StopCommand } from "./stop-command.model";

export interface StopEdit extends Omit<StopCommand, 'linkedOrder' | 'allowLinkedOrder'> {
  id: string
}
