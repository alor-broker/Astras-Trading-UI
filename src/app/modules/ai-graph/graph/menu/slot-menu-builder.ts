import {NodeBase} from "../nodes/node-base";
import {IContextMenuValue, IFoundSlot} from "@comfyorg/litegraph";
import {ContextMenu} from "../nodes/models";
import {TranslatorFn} from "../../../../shared/services/translator.service";

export class SlotMenuBuilder {
  static getMenu(targetNode: NodeBase, targetSlot: IFoundSlot, translator: TranslatorFn): ContextMenu {
    const options: (IContextMenuValue | null)[] = [];

    if ((targetSlot.output?.links?.length ?? 0) > 0) {
      options.push({
        content: translator(['labels', 'disconnectLinks'], {fallback: 'Disconnect Links'}),
        callback: () => {
          targetNode.graph?.beforeChange();
          if (targetSlot.output) {
            targetNode.disconnectOutput(targetSlot.slot);
          } else if (targetSlot.input) {
            targetNode.disconnectInput(targetSlot.slot);
          }
          targetNode.graph?.afterChange();
        }
      });
    }

    const slot = (targetSlot.input ?? targetSlot.output);
    if ((slot?.removable ?? true) && !(slot?.locked ?? false)) {
      options.push({
        content: translator(['labels', 'remove'], {fallback: 'Remove'}),
        callback: () => {
          targetNode.graph?.beforeChange();
          if (targetSlot.input) {
            targetNode.removeInput(targetSlot.slot);
          } else if (targetSlot.output) {
            targetNode.removeOutput(targetSlot.slot);
          }
          targetNode.graph?.afterChange();
        }
      });
    }

    const slotName = slot?.label ?? slot?.localized_name ?? slot?.name ?? "";
    return {
      title: slotName,
      items: options
    };
  }
}
