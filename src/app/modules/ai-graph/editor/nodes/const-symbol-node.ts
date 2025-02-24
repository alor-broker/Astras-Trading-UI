import {NodeBase} from "./node-base";
import {NodeCategories} from "./node-categories";

export class ConstSymbolNode extends NodeBase {
  static get nodeId(): string {
    return 'const-symbol';
  }

  static get nodeCategory(): string {
    return NodeCategories.InstrumentSelection;
  }

  constructor() {
    super(ConstSymbolNode.title);
  }
}
