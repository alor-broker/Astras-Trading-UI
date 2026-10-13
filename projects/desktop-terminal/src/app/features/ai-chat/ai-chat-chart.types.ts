export enum AiChatChartType {
  Line = 'line',
  Bar = 'bar',
  Pie = 'pie',
  Doughnut = 'doughnut'
}

export interface AiChatChartDefinition {
  version: 1;
  type: AiChatChartType;
  title: string;
  data: {
    labels: string[];
    series: {
      name: string;
      values: (number | null)[];
    }[];
  };
}
