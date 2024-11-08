import { PortfolioMeta } from "src/app/shared/models/user/portfolio-meta.model";
import { PortfolioKey } from "../portfolio-key.model";

export interface PortfolioExtended extends PortfolioMeta, PortfolioKey {
}
