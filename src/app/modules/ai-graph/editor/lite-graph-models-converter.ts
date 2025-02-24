import {INodeInputSlot, INodeOutputSlot, INodeSlot, SerialisableGraph} from "@comfyorg/litegraph";
import {
  GraphConfig,
  InputSlotConfig,
  NodeBaseConfig,
  NodeConfig,
  NodeSlotConfig,
  OutputSlotConfig
} from "../models/graph.model";
import {ISerialisedNode} from "@comfyorg/litegraph/dist/types/serialisation";

export class LiteGraphModelsConverter {
  static toGraphConfig(liteGraphConfig: SerialisableGraph): GraphConfig {
    const nodes = (liteGraphConfig.nodes ?? []).map(node => this.toNodeConfig(node));

    return {
      nodes,
      editorOptions: {
        state: {
          ...liteGraphConfig.state
        }
      }
    };
  }

  static toSerialisableGraph(config: GraphConfig): SerialisableGraph {
    const nodes = config.nodes.map(node => this.toSerialisedNode(node));

    return {
      version: 1,
      config: {},
      state: {
        ...config.editorOptions.state
      },
      nodes
    };
  }

  private static toNodeConfig(node: ISerialisedNode): NodeConfig {
    const baseOptions: NodeBaseConfig = {
      id: node.id.toString(),
      type: node.type!,
      inputs: (node.inputs ?? []).map(input => this.toInputSlotConfig(input)),
      outputs: (node.outputs ?? []).map(output => this.toOutputSlotConfig(output)),
      properties: {...node.properties}
    };

    return {
      baseOptions,
      editorOptions: {
        pos: node.pos,
        size: node.size,
      }
    };
  }

  private static toInputSlotConfig(inputSlot: INodeInputSlot): InputSlotConfig {
    return {
      ...this.toNodeSlotConfig(inputSlot),
      linkId: inputSlot.link
    };
  }

  private static toOutputSlotConfig(outputSlot: INodeOutputSlot): OutputSlotConfig {
    return {
      ...this.toNodeSlotConfig(outputSlot),
      links: (outputSlot.links ?? []).map(link => link)
    };
  }

  private static toNodeSlotConfig(slot: INodeSlot): NodeSlotConfig {
    return {
      name: slot.name,
      type: slot.type!,
    };
  }

  private static toSerialisedNode(node: NodeConfig): ISerialisedNode {
    return {
      ...node.baseOptions,
      ...node.editorOptions,
      inputs: node.baseOptions.inputs.map(i => this.toNodeInputSlot(i)),
      outputs: node.baseOptions.outputs.map(o => this.toNodeOutputSlot(o)),
      properties: {
        ...node.baseOptions.properties
      }
    };
  }

  private static toNodeInputSlot(inputSlot: InputSlotConfig): INodeInputSlot {
    return {
      ...this.toNodeSlot(inputSlot),
      link: inputSlot.linkId,
      _layoutElement: undefined
    };
  }

  private static toNodeOutputSlot(outputSlot: OutputSlotConfig): INodeOutputSlot {
    return {
      ...this.toNodeSlotConfig(outputSlot),
      links: (outputSlot.links ?? []).map(link => link)
    };
  }

  private static toNodeSlot(slot: NodeSlotConfig): INodeSlot {
    return {
      name: slot.name,
      type: slot.type!,
    };
  }
}
