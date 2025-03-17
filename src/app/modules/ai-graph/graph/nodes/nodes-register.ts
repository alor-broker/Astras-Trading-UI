import {ConstSymbolNode} from "./instrument-selection/const-symbol-node";
import {NodeBase} from "./node-base";
import {LiteGraph} from "@comfyorg/litegraph";
import {NewsSourceNode} from "./info-sources/news-source-node";
import {RequestToAiNode} from "./ai/request-to-ai-node";
import {MarkdownOutputNode} from "./output/markdown-output-node";
import {NodeCategories} from "./node-categories";
import {PortfolioNode} from "./instrument-selection/portfolio-node";

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

  static getRegistrationsForCategory(category: NodeCategories): NodeRegistration[] {
    return this.nodes.filter(node => node.class.nodeCategory === category);
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

NodesRegister.registerNode({
  type: RequestToAiNode.nodeType,
  class: RequestToAiNode
});

NodesRegister.registerNode({
  type: MarkdownOutputNode.nodeType,
  class: MarkdownOutputNode
});

NodesRegister.registerNode({
  type: PortfolioNode.nodeType,
  class: PortfolioNode
});
