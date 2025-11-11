'use client';

import type { ReactNode } from 'react';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  description?: string;
};

const ChartCard = ({ title, subtitle, description, children }: ChartCardProps) => (
  <article className="chart-card">
    <header className="chart-card__header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <span className="chart-card__subtitle">{subtitle}</span> : null}
      </div>
      {description ? <p className="chart-card__description">{description}</p> : null}
    </header>
    <div className="chart-card__body">{children}</div>
  </article>
);

export default ChartCard;

