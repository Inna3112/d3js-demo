'use client';

import { useCallback, useMemo, useState } from 'react';
import ChartCard from './ChartCard';
import ClientsPieChart from './charts/ClientsPieChart';
import SalesBarChart from './charts/SalesBarChart';
import UsersLineChart from './charts/UsersLineChart';
import { generateDashboardData } from '../data/mockData';

const Dashboard = () => {
  const [dataset, setDataset] = useState(() => generateDashboardData());
  const [iteration, setIteration] = useState(1);

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

  const handleChangeData = useCallback(() => {
    setDataset(generateDashboardData());
    setIteration((prev) => prev + 1);
  }, []);

  return (
    <section className="dashboard" aria-live="polite">
      <div className="dashboard__controls">
        <div className="dashboard__cycle">
          <span className="dashboard__cycle-label">Scenario</span>
          <span className="dashboard__cycle-value">{iteration}</span>
        </div>
        <button type="button" className="dashboard__button" onClick={handleChangeData}>
          Change data
        </button>
      </div>
      <div className="dashboard__metrics">
        {metrics.map((metric) => (
          <div className="dashboard__metric" key={metric.label}>
            <span className="dashboard__metric-label">{metric.label}</span>
            <span className="dashboard__metric-value">{metric.value}</span>
            {metric.helper ? <span className="dashboard__metric-helper">{metric.helper}</span> : null}
          </div>
        ))}
      </div>
      <div className="dashboard__grid">
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
};

export default Dashboard;

