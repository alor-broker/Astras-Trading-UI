import {NodeBase} from "./node-base";
import {LiteGraph} from "@comfyorg/litegraph";
import {ConstSymbolNode} from "./const-symbol-node";
import {NewsSourceNode} from "./news-source-node";

interface NodeRegistration {
  type: string;
  class: typeof NodeBase;
}

export class NodesRegister {
  private static readonly nodes: NodeRegistration[] = [];

  static registerNode(node: NodeRegistration): void {
    this.nodes.push(node);
  }

  static fillLGraphRegistration(): void {
    this.nodes.forEach(node => {
      LiteGraph.registerNodeType(
        node.type,
        node.class
      );
    });
  }
}

// need to accumulate import for node files here
// in other case because of tree shaking node files will not be registered in LiteGraph

NodesRegister.registerNode({
  type: ConstSymbolNode.nodeType,
  class: ConstSymbolNode
});

NodesRegister.registerNode({
  type: NewsSourceNode.nodeType,
  class: NewsSourceNode
});
