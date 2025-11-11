'use client';

import {
  axisBottom,
  axisLeft,
  max,
  scaleBand,
  scaleLinear,
  select,
} from 'd3';
import type { Selection } from 'd3-selection';
import { useEffect, useRef, useState } from 'react';
import type { MonthlySales } from '../../data/mockData';

type SalesBarChartProps = {
  data: MonthlySales[];
};

type TooltipState = {
  visible: boolean;
  label: string;
  value: number;
  x: number;
  y: number;
};

const initialTooltip: TooltipState = {
  visible: false,
  label: '',
  value: 0,
  x: 0,
  y: 0,
};

const SalesBarChart = ({ data }: SalesBarChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(initialTooltip);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 640;
    const height = 360;
    const margin = { top: 24, right: 24, bottom: 48, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'sales-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a');

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scaleBand()
      .domain(data.map((d) => d.month))
      .range([0, innerWidth])
      .padding(0.18);

    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.sales)! * 1.1])
      .nice()
      .range([innerHeight, 0]);

    chart
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axisBottom(xScale));

    chart
      .append('g')
      .attr('class', 'axis axis--y')
      .call(
        axisLeft(yScale).tickFormat((value) => {
          if (typeof value === 'number') {
            return `$${Math.round(value / 1000)}k`;
          }
          return String(value);
        }),
      );

    const barsGroup = chart.append('g').attr('class', 'bars');

    const updateTooltip = (event: PointerEvent, datum: MonthlySales) => {
      if (!wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        label: datum.month,
        value: datum.sales,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };

    const hideTooltip = () => setTooltip(initialTooltip);

    const bars = barsGroup.selectAll<SVGRectElement, MonthlySales>('rect').data(data, (d) => d.month);

    const handleInteraction = (selection: Selection<SVGRectElement, MonthlySales, SVGGElement, unknown>) => {
      selection
        .on('pointerenter', (event, datum) => {
          updateTooltip(event, datum);
        })
        .on('pointermove', (event, datum) => {
          updateTooltip(event, datum);
        })
        .on('pointerleave', () => {
          hideTooltip();
        });
    };

    bars
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => (xScale(d.month) ?? 0) + xScale.bandwidth() / 2)
            .attr('width', 0)
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('rx', 8)
            .attr('ry', 8)
            .style('fill', 'url(#sales-gradient)')
            .call(handleInteraction)
            .transition()
            .duration(800)
            .attr('x', (d) => xScale(d.month) ?? 0)
            .attr('width', xScale.bandwidth())
            .attr('y', (d) => yScale(d.sales))
            .attr('height', (d) => innerHeight - yScale(d.sales)),
        (update) =>
          update
            .call(handleInteraction)
            .transition()
            .duration(800)
            .attr('x', (d) => xScale(d.month) ?? 0)
            .attr('width', xScale.bandwidth())
            .attr('y', (d) => yScale(d.sales))
            .attr('height', (d) => innerHeight - yScale(d.sales)),
        (exit) =>
          exit
            .transition()
            .duration(400)
            .attr('y', innerHeight)
            .attr('height', 0)
            .style('opacity', 0)
            .remove(),
      );

    barsGroup
      .selectAll<SVGTextElement, MonthlySales>('text')
      .data(data, (d) => d.month)
      .join(
        (enter) =>
          enter
            .append('text')
            .attr('class', 'bar-label')
            .attr('text-anchor', 'middle')
            .attr('x', (d) => (xScale(d.month) ?? 0) + xScale.bandwidth() / 2)
            .attr('y', innerHeight)
            .style('opacity', 0)
            .text((d) => `$${Math.round(d.sales / 1000)}k`)
            .transition()
            .delay(400)
            .duration(600)
            .style('opacity', 1)
            .attr('y', (d) => yScale(d.sales) - 12),
        (update) =>
          update
            .transition()
            .duration(800)
            .attr('x', (d) => (xScale(d.month) ?? 0) + xScale.bandwidth() / 2)
            .attr('y', (d) => yScale(d.sales) - 12)
            .text((d) => `$${Math.round(d.sales / 1000)}k`),
        (exit) =>
          exit
            .transition()
            .duration(400)
            .style('opacity', 0)
            .attr('y', innerHeight)
            .remove(),
      );
  }, [data]);

  return (
    <div className="chart-wrapper" ref={wrapperRef}>
      <svg ref={svgRef} role="img" aria-label="Monthly sales bar chart" />
      {tooltip.visible ? (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <strong>{tooltip.label}</strong>
          <span>${tooltip.value.toLocaleString()}</span>
        </div>
      ) : null}
    </div>
  );
};

export default SalesBarChart;

