'use client';

import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  arc as d3Arc,
  interpolate,
  pie as d3Pie,
  scaleOrdinal,
  schemeTableau10,
  select,
} from 'd3';

import type { ClientDistribution } from '@/data/mockData';

import styles from './Chart.module.scss';

type ClientsPieChartProps = {
  data: ClientDistribution[],
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

function ClientsPieChart({ data }: ClientsPieChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(initialTooltip);

  const colorScale = useMemo(() => {
    const scale = scaleOrdinal<string, string>(schemeTableau10);
    scale.domain(data.map((item) => item.region));
    return scale;
  }, [data]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 360;
    const height = 360;
    const radius = Math.min(width, height) / 2 - 8;

    const svg = select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const chart = svg
      .append<SVGGElement>('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pieGenerator = d3Pie<ClientDistribution>()
      .value((d) => d.clients)
      .sort(null);

    const arcGenerator = d3Arc<d3.PieArcDatum<ClientDistribution>>()
      .outerRadius(radius)
      .innerRadius(radius * 0.55)
      .cornerRadius(12);

    const updateTooltip = (event: PointerEvent, datum: ClientDistribution) => {
      if (!wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        label: datum.region,
        value: datum.clients,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };

    const hideTooltip = () => setTooltip(initialTooltip);

    const handleSlicePointer = (
      event: unknown,
      datum: d3.PieArcDatum<ClientDistribution>,
    ) => {
      if (!(event instanceof PointerEvent)) {
        return;
      }
      updateTooltip(event, datum.data);
    };

    const toTransform = (datum: d3.PieArcDatum<ClientDistribution>) => {
      const [centroidX, centroidY] = arcGenerator.centroid(datum);
      return `translate(${centroidX}, ${centroidY})`;
    };

    const arcs = chart.selectAll<SVGPathElement, d3.PieArcDatum<ClientDistribution>>('path').data(
      pieGenerator(data),
      (d) => d.data.region,
    );

    arcs
      .join(
        (enter) => enter
          .append('path')
          .attr('class', 'pie-slice')
          .attr('fill', (d) => colorScale(d.data.region))
          .attr('d', (d) => arcGenerator({
            ...d,
            endAngle: d.startAngle,
          }) ?? '')
          .on('pointerenter', handleSlicePointer)
          .on('pointermove', handleSlicePointer)
          .on('pointerleave', hideTooltip)
          .transition()
          .duration(800)
          .attrTween('d', (d) => {
            const interpolateAngles = interpolate(d.startAngle, d.endAngle);
            const original = { ...d };
            return (t) => arcGenerator({
              ...original,
              endAngle: interpolateAngles(t),
            }) ?? '';
          }),
        (update) => update
          .on('pointerenter', handleSlicePointer)
          .on('pointermove', handleSlicePointer)
          .on('pointerleave', hideTooltip)
          .transition()
          .duration(750)
          .attrTween('d', (datum, index, groups: ArrayLike<SVGPathElement>) => {
            const node = groups[index];
            if (!(node instanceof SVGPathElement)) {
              return () => arcGenerator(datum) ?? '';
            }
            const previous = node.getAttribute('d');
            const current = arcGenerator(datum);
            if (!previous || !current) {
              return () => current ?? '';
            }
            const interpolatePath = interpolate(previous, current);
            return (t) => interpolatePath(t);
          }),
        (exit) => exit
          .transition()
          .duration(400)
          .style('opacity', 0)
          .remove(),
      );

    chart
      .selectAll<SVGTextElement, d3.PieArcDatum<ClientDistribution>>('text')
      .data(pieGenerator(data))
      .join(
        (enter) => enter
          .append('text')
          .attr('class', 'pie-label')
          .attr('transform', (d) => toTransform(d))
          .style('opacity', 0)
          .text((d) => `${Math.round(d.data.clients)}`)
          .transition()
          .delay(300)
          .duration(500)
          .style('opacity', 1),
        (update) => update
          .transition()
          .duration(750)
          .attr('transform', (d) => toTransform(d))
          .text((d) => `${Math.round(d.data.clients)} users`),
        (exit) => exit
          .transition()
          .duration(200)
          .style('opacity', 0)
          .remove(),
      );
  }, [colorScale, data]);

  return (
    <div className={`${styles.chartWrapper} ${styles.chartWrapperCenter}`} ref={wrapperRef}>
      <svg ref={svgRef} className={styles.svg} role="img" aria-label="Client distribution pie chart" />
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
            clients
          </span>
        </div>
      ) : null}
      <div className={styles.chartLegend}>
        {data.map((item) => (
          <div className={styles.legendItem} key={item.region}>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: colorScale(item.region) }}
            />
            <span className={styles.legendLabel}>
              {item.region}
              {' '}
              <span className={styles.legendValue}>
                {item.clients.toLocaleString()}
                {' '}
                clients
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientsPieChart;
