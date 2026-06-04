export interface Descriptor {
  id: string;
  translationKey?: string;
  formattedValue: string;
  valueTranslationKey?: string;
  titleTooltipTranslationKey?: string;
  customStyles?: Record<string, string | number | null>;
}

export interface DescriptorsGroup {
  title: string | null;
  items: Descriptor[];
}
