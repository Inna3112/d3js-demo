'use client';

import { useEffect, useRef, useState } from 'react';
import {
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

import type { Selection } from 'd3-selection';
import type { RevenueProfitPoint } from '@/data/mockData';

import styles from './Chart.module.scss';

type RevenueProfitLineChartProps = {
  data: RevenueProfitPoint[],
};

type TooltipState = {
  visible: boolean,
  label: string,
  revenue: number,
  profit: number,
  x: number,
  y: number,
};

const initialTooltip: TooltipState = {
  visible: false,
  label: '',
  revenue: 0,
  profit: 0,
  x: 0,
  y: 0,
};

type MetricKey = 'revenue' | 'profit';

type LineConfig = {
  key: MetricKey,
  label: string,
  color: string,
};

type FocusCircleSelection = Selection<SVGCircleElement, unknown, SVGGElement | null, unknown>;

const lineConfigs: LineConfig[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    color: '#38bdf8',
  },
  {
    key: 'profit',
    label: 'Profit',
    color: '#22d3ee',
  },
];

function RevenueProfitLineChart({ data }: RevenueProfitLineChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(initialTooltip);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const target = wrapperRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setHasAnimated(false);
  }, [data]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return () => {};
    }

    const shouldAnimate = isInView && !hasAnimated;

    setTooltip(initialTooltip);

    const width = 960;
    const height = 320;
    const margin = {
      top: 24, right: 32, bottom: 48, left: 72,
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = select<SVGSVGElement, unknown>(svgElement);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const chart = svg.append<SVGGElement>('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scalePoint()
      .domain(data.map((d) => d.month))
      .range([0, innerWidth]);

    const yDomainMax = max(data, (d) => Math.max(d.revenue, d.profit)) ?? 1;

    const yScale = scaleLinear()
      .domain([0, yDomainMax * 1.1])
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

    const focusCircles: Partial<Record<MetricKey, FocusCircleSelection>> = {};

    lineConfigs.forEach((config) => {
      const lineGenerator = d3Line<RevenueProfitPoint>()
        .x((d) => xScale(d.month) ?? 0)
        .y((d) => yScale(d[config.key]))
        .curve(curveCatmullRom.alpha(0.65));

      const linePath = chart
        .append<SVGPathElement>('path')
        .attr('class', styles.trendLine)
        .attr('stroke', config.color)
        .attr('d', lineGenerator(data) ?? '');

      const totalLength = linePath.node()?.getTotalLength() ?? 0;
      const isLastLine = config.key === lineConfigs[lineConfigs.length - 1].key;
      const finalizeLine = () => {
        linePath.attr('stroke-dasharray', null).attr('stroke-dashoffset', null);
      };

      if (shouldAnimate) {
        const transition = linePath
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(900)
          .attr('stroke-dashoffset', 0);

        transition.on('end', () => {
          finalizeLine();
          if (isLastLine) {
            setHasAnimated(true);
          }
        });
      } else if (hasAnimated) {
        finalizeLine();
      } else {
        linePath
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength);
      }

      focusCircles[config.key] = chart
        .append('circle')
        .attr('class', styles.trendFocus)
        .attr('r', 6)
        .attr('stroke', config.color)
        .attr('fill', '#0f172a')
        .style('opacity', 0);
    });

    const updateTooltip = (event: PointerEvent, datum: RevenueProfitPoint) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const bounds = wrapper.getBoundingClientRect();
      setTooltip({
        visible: true,
        label: datum.month,
        revenue: datum.revenue,
        profit: datum.profit,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };

    const hideTooltip = () => {
      setTooltip(initialTooltip);
      Object.values(focusCircles).forEach((circle) => {
        if (circle) {
          circle.transition().duration(150).style('opacity', 0);
        }
      });
    };

    const overlay = chart
      .append('rect')
      .attr('class', styles.lineOverlay)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .on('pointerleave', hideTooltip)
      .on('pointerenter', () => {
        Object.values(focusCircles).forEach((circle) => {
          if (circle) {
            circle.interrupt().style('opacity', 1);
          }
        });
      })
      .on('pointermove', (event) => {
        if (!(event instanceof PointerEvent)) {
          return;
        }

        const overlayNode = event.currentTarget;
        if (!(overlayNode instanceof SVGRectElement)) {
          return;
        }

        const [xPos] = pointer(event, overlayNode);
        const clampedX = Math.max(0, Math.min(innerWidth, xPos));
        const step = innerWidth / Math.max(1, data.length - 1);
        const index = Math.min(
          data.length - 1,
          Math.max(0, Math.round(clampedX / step)),
        );
        const datum = data[index];
        const cx = xScale(datum.month) ?? 0;

        lineConfigs.forEach((config) => {
          const circle = focusCircles[config.key];
          if (circle) {
            circle
              .attr('cx', cx)
              .attr('cy', yScale(datum[config.key]))
              .style('opacity', 1);
          }
        });

        updateTooltip(event, datum);
      });

    return () => {
      overlay.on('pointerleave', null).on('pointerenter', null).on('pointermove', null);
    };
  }, [data, isInView, hasAnimated]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartWrapper} ref={wrapperRef}>
        <svg ref={svgRef} className={styles.svg} role="img" aria-label="Revenue and profit trend" />
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
              Revenue:
              {' '}
              $
              {tooltip.revenue.toLocaleString()}
            </span>
            <span className={styles.span}>
              Profit:
              {' '}
              $
              {tooltip.profit.toLocaleString()}
            </span>
          </div>
        ) : null}
      </div>
      <div className={styles.chartLegend}>
        {lineConfigs.map((config) => (
          <div key={config.key} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: config.color }}
            />
            <span className={styles.legendLabel}>
              {config.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RevenueProfitLineChart;
