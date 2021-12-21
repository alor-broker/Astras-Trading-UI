import { Credentials } from "./credentials.model";

export interface Login {
  credentials: Credentials,
  requiredServices: string[]
}
