import { Provider } from "@angular/core";
import { InvestIdeasService } from "../modules/invest-ideas/services/invest-ideas.service";

export const extModules = [];

export const extProvides: Provider[] = [
  InvestIdeasService
];
