import { GraphConfig } from "./graph.model";

export interface GraphTemplate {
  id: string;
  title: string;
  titleTranslationKey?: string;
  category: string;
  categoryTranslationKey?: string;
  config: GraphConfig;
}
