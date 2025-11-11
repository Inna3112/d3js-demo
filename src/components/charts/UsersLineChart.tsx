'use client';

import { useEffect, useRef, useState } from 'react';
import {
  area as d3Area,
  axisBottom,
  axisLeft,
  curveCatmullRom,
  line as d3Line,
  max,
  pointer,
  scaleLinear,
  scalePoint,
  select,
} from 'd3';

import type { UserGrowth } from '@/data/mockData';

import styles from './Chart.module.scss';

type UsersLineChartProps = {
  data: UserGrowth[],
};

type TooltipState = {
  visible: boolean,
  label: string,
  value: number,
  x: number,
  y: number,
};

const initialTooltip: TooltipState = {
  visible: false,
  label: '',
  value: 0,
  x: 0,
  y: 0,
};

function UsersLineChart({ data }: UsersLineChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(initialTooltip);

  useEffect(() => {
    if (!svgRef.current) return () => {};

    const width = 640;
    const height = 360;
    const margin = {
      top: 24, right: 24, bottom: 48, left: 64,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const chart = svg.append<SVGGElement>('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scalePoint()
      .domain(data.map((d) => d.month))
      .range([0, innerWidth]);

    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.users)! * 1.1])
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
            return `${Math.round(value)}`;
          }
          return String(value);
        }),
      );

    const lineGenerator = d3Line<UserGrowth>()
      .x((d) => xScale(d.month) ?? 0)
      .y((d) => yScale(d.users))
      .curve(curveCatmullRom.alpha(0.65));

    const areaGenerator = d3Area<UserGrowth>()
      .x((d) => xScale(d.month) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.users))
      .curve(curveCatmullRom.alpha(0.65));

    const zeroAreaGenerator = d3Area<UserGrowth>()
      .x((d) => xScale(d.month) ?? 0)
      .y0(innerHeight)
      .y1(() => innerHeight)
      .curve(curveCatmullRom.alpha(0.65));

    const areaPath = chart
      .append<SVGPathElement>('path')
      .attr('class', 'line-area')
      .attr('d', zeroAreaGenerator(data) ?? '');

    areaPath.transition().duration(900).attr('d', areaGenerator(data) ?? '');

    const linePath = chart
      .append<SVGPathElement>('path')
      .attr('class', 'line-path')
      .attr('d', lineGenerator(data) ?? '');

    const totalLength = linePath.node()?.getTotalLength() ?? 0;
    linePath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(900)
      .attr('stroke-dashoffset', 0);

    const focusCircle = chart
      .append('circle')
      .attr('class', 'line-focus')
      .attr('r', 6)
      .style('opacity', 0);

    const updateTooltip = (event: PointerEvent, datum: UserGrowth) => {
      if (!wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        label: datum.month,
        value: datum.users,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };

    const hideTooltip = () => {
      setTooltip(initialTooltip);
      focusCircle.transition().duration(150).style('opacity', 0);
    };

    chart
      .selectAll<SVGCircleElement, UserGrowth>('circle.data-point')
      .data<UserGrowth>(data, (datum) => datum.month)
      .join(
        (enter) => enter
          .append('circle')
          .attr('class', 'data-point')
          .attr('cx', (d) => xScale(d.month) ?? 0)
          .attr('cy', () => yScale(0))
          .attr('r', 0)
          .transition()
          .delay((_d, index) => index * 50)
          .duration(400)
          .attr('cy', (d) => yScale(d.users))
          .attr('r', 4),
        (update) => update
          .transition()
          .duration(700)
          .attr('cx', (d) => xScale(d.month) ?? 0)
          .attr('cy', (d) => yScale(d.users)),
        (exit) => exit
          .transition()
          .duration(200)
          .attr('r', 0)
          .remove(),
      );

    const handlePointerMove = (
      event: PointerEvent,
      overlayNode: SVGRectElement,
    ) => {
      const [xPos] = pointer(event, overlayNode);
      const clampedX = Math.max(0, Math.min(innerWidth, xPos));
      const step = innerWidth / Math.max(1, data.length - 1);
      const index = Math.min(
        data.length - 1,
        Math.max(0, Math.round(clampedX / step)),
      );
      const datum = data[index];
      const cx = xScale(datum.month) ?? 0;
      const cy = yScale(datum.users);
      focusCircle.attr('cx', cx).attr('cy', cy).style('opacity', 1);
      updateTooltip(event, datum);
    };

    const overlay = chart
      .append('rect')
      .attr('class', 'line-overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .on('pointerleave', () => {
        hideTooltip();
      })
      .on('pointerenter', () => {
        focusCircle.interrupt().style('opacity', 1);
      })
      .on('pointermove', (event) => {
        if (event instanceof PointerEvent) {
          const overlayElement = event.currentTarget;
          if (overlayElement instanceof SVGRectElement) {
            handlePointerMove(event, overlayElement);
          }
        }
      });

    return () => {
      overlay.on('pointerleave', null).on('pointerenter', null).on('pointermove', null);
    };
  }, [data]);

  return (
    <div className={styles.chartWrapper} ref={wrapperRef}>
      <svg ref={svgRef} className={styles.svg} role="img" aria-label="Monthly active users line chart" />
      {tooltip.visible ? (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <strong className={styles.strong}>{tooltip.label}</strong>
          <span className={styles.span}>
            {tooltip.value.toLocaleString()}
            {' '}
            users
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default UsersLineChart;
