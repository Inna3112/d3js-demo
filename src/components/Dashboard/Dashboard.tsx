'use client';

import {
  useCallback, useEffect, useMemo, useState,
} from 'react';

import ChartCard from '../ChartChard/ChartCard';
import ClientsPieChart from '../charts/ClientsPieChart';
import SalesBarChart from '../charts/SalesBarChart';
import UsersLineChart from '../charts/UsersLineChart';

import styles from './Dashboard.module.scss';

import { type DashboardData, generateDashboardData } from '@/data/mockData';

type DashboardProps = {
  initialData: DashboardData,
};

function Dashboard({ initialData }: DashboardProps) {
  const [dataset, setDataset] = useState<DashboardData>(initialData);
  const [iteration, setIteration] = useState(1);

  useEffect(() => {
    setDataset(initialData);
    setIteration(1);
  }, [initialData]);

  const metrics = useMemo(() => {
    const totalSales = dataset.sales.reduce((acc, item) => acc + item.sales, 0);
    const averageMonthlySales = totalSales / dataset.sales.length;
    const topRegion = dataset.clients.reduce((acc, item) => {
      if (!acc || item.clients > acc.clients) {
        return item;
      }
      return acc;
    }, dataset.clients[0]);
    const firstUsers = dataset.users[0]?.users ?? 1;
    const lastUsers = dataset.users[dataset.users.length - 1]?.users ?? firstUsers;
    const growthRate = ((lastUsers - firstUsers) / firstUsers) * 100;

    return [
      {
        label: 'Total sales',
        value: `$${(totalSales / 1000).toFixed(1)}k`,
      },
      {
        label: 'Avg monthly',
        value: `$${Math.round(averageMonthlySales).toLocaleString()}`,
      },
      {
        label: 'Top region',
        value: `${topRegion?.region ?? 'N/A'}`,
        helper: `${topRegion?.clients.toLocaleString()} clients`,
      },
      {
        label: 'User growth',
        value: `${growthRate.toFixed(1)}%`,
      },
    ];
  }, [dataset]);

  const onChangeData = useCallback(() => {
    setDataset(generateDashboardData());
    setIteration((prev) => prev + 1);
  }, []);

  return (
    <section className={styles.dashboard} aria-live="polite">
      <div className={styles.controls}>
        <div className={styles.cycle}>
          <span className={styles.cycleLabel}>Scenario</span>
          <span className={styles.cycleValue}>{iteration}</span>
        </div>
        <button type="button" className={styles.button} onClick={onChangeData}>
          Change data
        </button>
      </div>
      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <div className={styles.metric} key={metric.label}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricValue}>{metric.value}</span>
            {metric.helper ? <span className={styles.metricHelper}>{metric.helper}</span> : null}
          </div>
        ))}
      </div>
      <div className={styles.grid}>
        <ChartCard
          title="Monthly Sales"
          subtitle="Bar chart"
          description="Hover columns to inspect revenue."
        >
          <SalesBarChart data={dataset.sales} />
        </ChartCard>
        <ChartCard
          title="Client Distribution"
          subtitle="Pie chart"
          description="Regions sized by active clients."
        >
          <ClientsPieChart data={dataset.clients} />
        </ChartCard>
        <ChartCard
          title="User Growth"
          subtitle="Line chart"
          description="Pointer over the chart to see month-by-month changes."
        >
          <UsersLineChart data={dataset.users} />
        </ChartCard>
      </div>
    </section>
  );
}

export default Dashboard;
