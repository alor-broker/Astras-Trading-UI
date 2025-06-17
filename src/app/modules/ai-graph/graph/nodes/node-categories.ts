import { LiteGraph } from "@comfyorg/litegraph";

export enum NodeCategories {
  Base = 'base',
  InstrumentSelection = 'instrument-selection',
  InfoSources = 'info-sources',
  AI = 'ai',
  Output = 'output'
}

export interface NodeCategoryColor {
  headerColor: string;
  bodyColor: string;
}

export const NodeCategoryColors: Record<NodeCategories, NodeCategoryColor> = {
  [NodeCategories.Base]: {
    headerColor: LiteGraph.NODE_DEFAULT_COLOR,
    bodyColor: LiteGraph.NODE_DEFAULT_BGCOLOR
  },
  [NodeCategories.InstrumentSelection]: {
    headerColor: "#2a363b",
    bodyColor: "#3f5159"
  },
  [NodeCategories.InfoSources]: {
    headerColor: "#223",
    bodyColor: "#335"
  },
  [NodeCategories.AI]: {
    headerColor: "#232",
    bodyColor: "#353"
  },
  [NodeCategories.Output]: {
    headerColor: "#432",
    bodyColor: "#653"
  },
};
