'use client';

import type { ReactNode } from 'react';

import styles from './ChartCard.module.scss';

type ChartCardProps = {
  title: string,
  subtitle?: string,
  children: ReactNode,
  description?: string,
};

function ChartCard({
  title, subtitle, description, children,
}: ChartCardProps) {
  return (
    <article className={styles.chartCard}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </div>
        {description ? <p className={styles.description}>{description}</p> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </article>
  );
}

ChartCard.defaultProps = {
  subtitle: '',
  description: undefined,
};

export default ChartCard;
