import {INodeSlot, SerialisableGraph, SerialisableLLink} from "@comfyorg/litegraph";
import {
  GraphConfig,
  InputSlotConfig,
  LinkConfig,
  NodeBaseConfig,
  NodeConfig,
  NodeId,
  NodeSlotConfig,
  OutputSlotConfig
} from "../models/graph.model";
import {
  ISerialisedNode,
  ISerialisedNodeInputSlot,
  ISerialisedNodeOutputSlot
} from "@comfyorg/litegraph/dist/types/serialisation";

export class LiteGraphModelsConverter {
  static toGraphConfig(liteGraphConfig: SerialisableGraph): GraphConfig {
    const nodes = (liteGraphConfig.nodes ?? []).map(node => this.toNodeConfig(node));
    const links = (liteGraphConfig.links ?? []).map(link => this.toLinkConfig(link));

    return {
      nodes,
      links,
      editorOptions: {
        state: {
          ...liteGraphConfig.state
        }
      }
    };
  }

  static toSerialisableGraph(config: GraphConfig): SerialisableGraph {
    const nodes = config.nodes.map(node => this.toSerialisedNode(node));
    const links = config.links.map(link => this.toSerialisableLink(link));

    return {
      version: 1,
      config: {},
      state: {
        ...config.editorOptions.state
      },
      nodes,
      links
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
        title: node.title,
        pos: node.pos,
        size: node.size,
      }
    };
  }

  private static toInputSlotConfig(inputSlot: ISerialisedNodeInputSlot): InputSlotConfig {
    return {
      ...this.toNodeSlotConfig(inputSlot),
      linkId: inputSlot.link
    };
  }

  private static toOutputSlotConfig(outputSlot: ISerialisedNodeOutputSlot): OutputSlotConfig {
    return {
      ...this.toNodeSlotConfig(outputSlot),
      links: (outputSlot.links ?? []).map(link => link)
    };
  }

  private static toNodeSlotConfig(slot: INodeSlot): NodeSlotConfig {
    return {
      name: slot.name,
      type: slot.type!,
      editorOptions: {
        label: slot.label,
        localized_name: slot.localized_name,
        nameLocked: slot.nameLocked,
        removable: slot.removable,
        shape: slot.shape
      }
    };
  }

  private static toLinkConfig(link: SerialisableLLink): LinkConfig {
    return {
      linkId: link.id,
      originId: link.origin_id as NodeId,
      originSlotIndex: link.origin_slot,
      targetId: link.target_id as NodeId,
      targetSlotIndex: link.target_slot,
      type: link.type
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

  private static toNodeInputSlot(inputSlot: InputSlotConfig): ISerialisedNodeInputSlot {
    return {
      ...this.toNodeSlot(inputSlot),
      link: inputSlot.linkId
    };
  }

  private static toNodeOutputSlot(outputSlot: OutputSlotConfig): ISerialisedNodeOutputSlot {
    return {
      ...this.toNodeSlot(outputSlot),
      links: (outputSlot.links ?? []).map(link => link),
    };
  }

  private static toNodeSlot(slot: NodeSlotConfig): INodeSlot {
    return {
      name: slot.name,
      type: slot.type!,
      ...slot.editorOptions
    };
  }

  private static toSerialisableLink(link: LinkConfig): SerialisableLLink {
    return {
      id: link.linkId,
      origin_id: link.originId,
      origin_slot: link.originSlotIndex,
      target_id: link.targetId,
      target_slot: link.targetSlotIndex,
      type: link.type
    };
  }
}
