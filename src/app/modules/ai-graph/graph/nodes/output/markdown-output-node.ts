import {NodeBase} from "../node-base";
import {NodeCategories} from "../node-categories";
import {SlotType} from "../../slot-types";
import {Observable, of} from "rxjs";
import {map} from "rxjs/operators";
import {OutputFormat} from "../models";

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

  override executor(): Observable<boolean> {
    return of(true).pipe(
      map(() => {
        return true;
      })
    );
  }
}
