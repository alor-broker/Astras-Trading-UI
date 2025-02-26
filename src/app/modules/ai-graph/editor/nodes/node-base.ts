import {INodeInputSlot, LGraphNode} from "@comfyorg/litegraph";
import {Observable, of} from "rxjs";
import {INodeOutputSlot, ISlotType} from "@comfyorg/litegraph/dist/interfaces";
import {NodeSlotOptions, OutputDataObject, OutputFormat} from "./models";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";

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

  get outputFormat(): OutputFormat | null {
    return null;
  }

  onExecute(): void {
    // keep this only for nodes execution sorting
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  executor(context: GraphProcessingContextService): Observable<boolean> {
    return of(true);
  }

  addOutput(
    name: string,
    type: ISlotType,
    options: NodeSlotOptions
  ): INodeOutputSlot {
    return super.addOutput(
      name,
      type,
      options
    );
  }

  addInput(
    name: string,
    type: ISlotType,
    options: NodeSlotOptions
  ): INodeInputSlot {
    return super.addInput(
      name,
      type,
      options
    );
  }

  setOutputByName(outputName: string, data: number | string | boolean | OutputDataObject): void {
    const outputIndex = this.findOutputSlot(outputName);
    if (outputIndex >= 0) {
      this.setOutputData(
        outputIndex,
        data
      );
    }
  }

  getValueOfInput(name: string): unknown {
    const slot = this.findInputSlot(name);
    if (slot === -1) {
      return null;
    }

    if (slot >= this.inputs.length || this.inputs[slot].link == null) {
      return null;
    }

    const linkId = this.inputs[slot].link;

    return this.graph?.links.get(linkId)?.data ?? null;
  }
}
