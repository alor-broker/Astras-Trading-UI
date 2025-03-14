import {NodeBase} from "../node-base";
import {NodeCategories} from "../node-categories";
import {SlotType} from "../../slot-types";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {OutputFormat} from "../models";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";

export class MarkdownOutputNode extends NodeBase {
  constructor() {
    super(MarkdownOutputNode.title);

    this.addInput(
      "in",
      SlotType.String,
      {
        removable: false,
        nameLocked: true
      }
    );
  }

  static get nodeId(): string {
    return 'markdown-output';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.Output;
  }

  override get outputFormat(): OutputFormat {
    return OutputFormat.Markdown;
  }

  override get titleLocked(): boolean {
    return false;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      map(() => {
        return true;
      })
    );
  }
}
