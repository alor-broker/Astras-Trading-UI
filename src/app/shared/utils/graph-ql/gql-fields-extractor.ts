import Fields from "gql-query-builder/build/Fields";
import {
  ZodArray,
  ZodLazy,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodType
} from "zod/v3";

export class GqlFieldsExtractor {
  static getOperation(schema: ZodObject<ZodRawShape>): string {
    const keys = schema.keyof().options;
    return keys[0];
  }

  static getFields(schema: ZodObject<ZodRawShape>, skipField?: string): Fields {
    const shape = schema.shape;
    const objectFields = this.getObjectFields(shape);

    let fields: Fields = [];
    for (const field of objectFields) {
      const fieldDef = this.getFieldActualType(shape[field] as ZodType);
      if (fieldDef instanceof ZodObject) {
        const nestedFields = this.getFields(fieldDef);
        if (field === skipField) {
          fields = [...fields, ...nestedFields];
        } else {
          fields.push({ [field]: nestedFields });
        }
      } else {
        fields.push(field);
      }
    }

    return fields;
  }

  private static getObjectFields(shape: ZodRawShape): string[] {
    const fields: string[] = [];
    for (const fieldKey in shape) {
      if (fieldKey.startsWith('__')) {
        continue;
      }

      fields.push(fieldKey);
    }

    return fields;
  }

  private static getFieldActualType(typeDef: ZodType): ZodType {
    if (typeDef instanceof ZodOptional) {
      return this.getFieldActualType(typeDef.unwrap());
    }

    if (typeDef instanceof ZodNullable) {
      return this.getFieldActualType(typeDef.unwrap());
    }

    if (typeDef instanceof ZodArray) {
      return this.getFieldActualType(typeDef.element);
    }

    if(typeDef instanceof ZodLazy) {
      return this.getFieldActualType(typeDef.schema);
    }

    return typeDef;
  }
}
