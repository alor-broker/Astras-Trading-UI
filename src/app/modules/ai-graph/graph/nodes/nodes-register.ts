﻿import {ConstSymbolNode} from "./instrument-selection/const-symbol-node";
import {NodeBase} from "./node-base";
import {LiteGraph} from "@comfyorg/litegraph";
import {NewsSourceNode} from "./info-sources/news-source-node";
import {RequestToAiNode} from "./ai/request-to-ai-node";
import {MarkdownOutputNode} from "./output/markdown-output-node";
import {NodeCategories} from "./node-categories";
import {PortfolioNode} from "./instrument-selection/portfolio-node";
import {QuotesSourceNode} from "./info-sources/quotes-source-node";
import {HistorySourceNode} from "./info-sources/history-source-node";
import {PortfolioSummarySourceNode} from "./info-sources/portfolio-summary-source-node";
import {PortfolioPositionsSourceNode} from "./info-sources/portfolio-positions-source-node";
import {ReportsSourceNode} from "./info-sources/reports-source-node";

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

NodesRegister.registerNode({
  type: QuotesSourceNode.nodeType,
  class: QuotesSourceNode
});

NodesRegister.registerNode({
  type: HistorySourceNode.nodeId,
  class: HistorySourceNode
});

NodesRegister.registerNode({
  type: PortfolioSummarySourceNode.nodeType,
  class: PortfolioSummarySourceNode
});

NodesRegister.registerNode({
  type: PortfolioPositionsSourceNode.nodeType,
  class: PortfolioPositionsSourceNode
});

NodesRegister.registerNode({
  type: ReportsSourceNode.nodeId,
  class: ReportsSourceNode
});
