﻿import {NodeBase} from "../node-base";
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
        label: "in",
        removable: false,
        nameLocked: true
      }
    );
  }

  static get nodeId(): string {
    return 'markdown-output';
  }

  static get nodeCategory(): string {
    return NodeCategories.Output;
  }

  override executor(): Observable<boolean> {
    return of(true).pipe(
      map(() => {
        return true;
      })
    );
  }

  override get outputFormat(): OutputFormat {
    return OutputFormat.Markdown;
  }
}
