import { PortfolioMeta } from "src/app/shared/models/user/portfolio-meta.model";

export interface PortfolioExtended extends PortfolioMeta {
  exchange: string
}
