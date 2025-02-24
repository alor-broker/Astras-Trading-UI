import {NodeBase} from "./node-base";
import {NodeCategories} from "./node-categories";

export class NewsSourceNode extends NodeBase {
  static get nodeId(): string {
    return 'news';
  }

  static get nodeCategory(): string {
    return NodeCategories.InfoSources;
  }

  constructor() {
    super(NewsSourceNode.title);
  }
}
