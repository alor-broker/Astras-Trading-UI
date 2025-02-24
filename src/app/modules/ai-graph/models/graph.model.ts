export type SlotType = number | string;
export type LinkId = number;
export type NodeId = string;
export type Point = [x: number, y: number] | Float32Array | Float64Array;
export type Size = [width: number, height: number] | Float32Array | Float64Array;

interface BaseEditorOptions {
  pos?: Point;
  size?: Size;
}

export interface ItemConfig<TB, TE> {
  baseOptions: TB;
  editorOptions: TE;
}

export interface NodeSlotConfig {
  name: string;
  type: SlotType;
}

export interface InputSlotConfig extends NodeSlotConfig {
  linkId: LinkId | null;
}

export interface OutputSlotConfig extends NodeSlotConfig {
  links: LinkId[] | null;
}

export interface NodeBaseConfig {
  id: NodeId;
  type: string;
  inputs: InputSlotConfig[];
  outputs: OutputSlotConfig[];
  properties: Record<string, unknown>;
}

export type NodeConfig = ItemConfig<NodeBaseConfig, BaseEditorOptions>;

export interface GraphConfigEditorOptions {
  state: {
    lastGroupId: number;
    lastNodeId: number;
    lastLinkId: number;
    lastRerouteId: number;
  };
}

export interface GraphConfig {
  nodes: NodeConfig[];
  editorOptions: GraphConfigEditorOptions;
}

export interface Graph {
  id: string;
  title: string;
  createdTimestamp: number;
  config?: GraphConfig;
}
