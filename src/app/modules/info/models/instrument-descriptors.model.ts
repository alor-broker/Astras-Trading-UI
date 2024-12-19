export interface Descriptor {
  id: string;
  translationKey?: string;
  formattedValue: string;
  valueTranslationKey?: string;
  customStyles?: Record<string, any>;
}

export interface DescriptorsGroup {
  title: string | null;
  items: Descriptor[];
}
