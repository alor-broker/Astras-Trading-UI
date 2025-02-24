import {LGraphNode} from "@comfyorg/litegraph";

export class NodeBase extends LGraphNode {
  static get nodeId(): string {
    return "node-base";
  }

  static get nodeCategory(): string {
    return "base-category";
  }

  static get title(): string {
    return this.nodeId;
  }

  static get nodeType(): string {
    return `${this.nodeCategory}/${this.nodeId}`;
  }
}
