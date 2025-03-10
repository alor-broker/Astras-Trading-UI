import {IFoundSlot, INodeInputSlot, LGraphNode} from "@comfyorg/litegraph";
import {Observable, of} from "rxjs";
import {INodeOutputSlot, ISlotType} from "@comfyorg/litegraph/dist/interfaces";
import {ContextMenu, NodeSlotOptions, OutputDataObject, OutputFormat} from "./models";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";
import {TranslatorFn} from "../../../../shared/services/translator.service";
import {NodeMenuBuilder} from "../menu/node-menu-builder";
import {NodeCategories} from "./node-categories";
import {SlotMenuBuilder} from "../menu/slot-menu-builder";

export class NodeBase extends LGraphNode {
  static get nodeId(): string {
    return "node-base";
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.Base;
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

  get titleLocked(): boolean {
    return true;
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

  getInputSlotLocalizedLabel?(input: INodeInputSlot, translator: TranslatorFn): string;

  getOutputSlotLocalizedLabel?(output: INodeOutputSlot, translator: TranslatorFn): string;

  getPropertyLocalizedLabel?(name: string, translator: TranslatorFn): string;
  getNodeMenu(translator: TranslatorFn, customCallbacks?: {
    editNodeProperties?: (node: NodeBase) => void;
  }): ContextMenu {
    return NodeMenuBuilder.getMenu(this, translator, customCallbacks);
  }

  getSlotMenu(targetSlot: IFoundSlot, translator: TranslatorFn): ContextMenu {
    return SlotMenuBuilder.getMenu(this, targetSlot, translator);
  }
}
