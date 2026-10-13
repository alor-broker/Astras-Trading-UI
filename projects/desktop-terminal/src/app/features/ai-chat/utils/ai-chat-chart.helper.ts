import {z} from 'zod';
import {
  AiChatChartDefinition,
  AiChatChartType
} from '../ai-chat-chart.types';

const nonemptyString = z.string().regex(/\S/);
const chartSchema = z.strictObject({
  version: z.literal(1),
  type: z.enum(AiChatChartType),
  title: nonemptyString,
  data: z.strictObject({
    labels: z.array(nonemptyString).min(1),
    series: z.array(z.strictObject({
      name: nonemptyString,
      values: z.array(z.number().nullable()).min(1)
    })).min(1)
  })
}).refine(chart => {
  const isCircular = chart.type === AiChatChartType.Pie || chart.type === AiChatChartType.Doughnut;
  return (!isCircular || chart.data.series.length === 1) && chart.data.series.every(series =>
    series.values.length === chart.data.labels.length
    && series.values.some(value => value != null)
    && (!isCircular || (
      series.values.every(value => value != null && value >= 0)
      && series.values.some(value => value != null && value > 0)
    ))
  );
});

export class AiChatChartHelper {
  static parse(source: string): AiChatChartDefinition | null {
    try {
      const value: unknown = JSON.parse(source);
      const result = chartSchema.safeParse(value);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
}
