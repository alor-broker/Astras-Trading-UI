import {
  AiChatChartDefinition,
  AiChatChartType
} from '../ai-chat-chart.types';
import {AiChatChartHelper} from './ai-chat-chart.helper';

describe('AiChatChartHelper', () => {
  function createChart(overrides: Partial<AiChatChartDefinition> = {}): AiChatChartDefinition {
    return {
      version: 1,
      type: AiChatChartType.Line,
      title: 'Стоимость, RUB',
      data: {
        labels: ['Январь', 'Февраль', 'Март'],
        series: [{name: 'Портфель, RUB', values: [12.5, null, -3]}]
      },
      ...overrides
    };
  }

  it.each([AiChatChartType.Line, AiChatChartType.Bar])('should preserve gaps, negative values and decimals for %s', type => {
    const chart = createChart({type});
    chart.data.series.push({name: 'Индекс, RUB', values: [0, 5.25, null]});

    expect(AiChatChartHelper.parse(JSON.stringify(chart))).toEqual(chart);
  });

  it.each([AiChatChartType.Pie, AiChatChartType.Doughnut])('should accept zero and positive values for %s', type => {
    const chart = createChart({type});
    chart.data.series[0].values = [0, 1, 2.5];

    expect(AiChatChartHelper.parse(JSON.stringify(chart))).toEqual(chart);
  });

  it.each(['', '{', 'null', '[]', 'undefined'])('should reject malformed or missing chart objects: %s', source => {
    expect(AiChatChartHelper.parse(source)).toBeNull();
  });

  it.each([
    {version: 2},
    {type: 'scatter'},
    {title: ' \n '},
    {options: {onClick: 'alert(1)'}},
    {data: {labels: [], series: []}},
    {data: {labels: [' '], series: [{name: 'Value', values: [1]}]}},
    {data: {labels: ['A'], series: [{name: '', values: [1]}]}},
    {data: {labels: ['A'], series: [{name: 'Value', values: [1, 2]}]}},
    {data: {labels: ['A'], series: [{name: 'Value', values: [null]}]}},
    {data: {labels: ['A'], series: [{name: 'Value', values: ['1']}]}},
    {data: {labels: ['A'], series: [{name: 'Value', values: [1], unit: 'RUB'}]}}
  ])('should reject values outside the version 1 contract: %j', overrides => {
    const source = JSON.stringify({...createChart(), ...overrides});

    expect(AiChatChartHelper.parse(source)).toBeNull();
  });

  it('should reject JSON numbers that overflow to infinity', () => {
    const source = JSON.stringify(createChart()).replace('12.5', '1e400');

    expect(AiChatChartHelper.parse(source)).toBeNull();
  });

  it.each([AiChatChartType.Pie, AiChatChartType.Doughnut])('should reject gaps, negative values and zero totals for %s', type => {
    for (const values of [[1, null, 2], [1, -1, 2], [0, 0, 0]]) {
      const chart = createChart({type});
      chart.data.series[0].values = values;

      expect(AiChatChartHelper.parse(JSON.stringify(chart))).toBeNull();
    }
  });

  it.each([AiChatChartType.Pie, AiChatChartType.Doughnut])('should reject multiple series for %s', type => {
    const chart = createChart({type});
    chart.data.series = [
      {name: 'First', values: [1, 2, 3]},
      {name: 'Second', values: [4, 5, 6]}
    ];

    expect(AiChatChartHelper.parse(JSON.stringify(chart))).toBeNull();
  });
});
