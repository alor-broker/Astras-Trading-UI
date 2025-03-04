import {Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {INodeInputSlot} from "@comfyorg/litegraph";

export class RequestToAiNode extends NodeBase {
  private readonly inputSlotPrefix = 'in';
  readonly outputSlotName = 'out';
  readonly promptPropertyName = 'prompt';

  constructor() {
    super(RequestToAiNode.title);

    this.addProperty(
      this.promptPropertyName,
      '',
      SlotType.String,
      {
        'label': this.promptPropertyName
      }
    );

    for (let i = 1; i <= 5; i++) {
      this.addInput(
        `${this.inputSlotPrefix}${i}`,
        SlotType.String,
        {
          removable: true,
          nameLocked: false
        });
    }

    this.addOutput(
      this.outputSlotName,
      SlotType.String,
      {
        removable: false,
        nameLocked: true
      }
    );
  }

  static get nodeId(): string {
    return 'request-to-ai';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.AI;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return of(true).pipe(
      switchMap(() => {
        const prompt = this.preparePrompt();
        if (prompt == null || prompt.length === 0) {
          return of(false);
        }

        return context.llmService.sendQuery(prompt).pipe(
          map(x => {
            if (x != null) {
              this.setOutputByName(
                this.outputSlotName,
                x.answer
              );

              return true;
            }

            return false;
          })
        );
      })
    );
  }

  getInputSlotLocalizedLabel?(input: INodeInputSlot): string {
    return input.name;
  }

  private preparePrompt(): string | null {
    let prompt = this.properties[this.promptPropertyName] as string;

    if (prompt == null || prompt.length === 0) {
      return null;
    }

    for (const input of this.inputs) {
      const value = this.getValueOfInput(input.name)?.toString();
      if (value == null || value.length === 0) {
        continue;
      }

      prompt = prompt.replace(`{{${input.name}}}`, value);
    }

    return prompt;
  }
}
