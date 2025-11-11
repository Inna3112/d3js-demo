import Dashboard from '../components/Dashboard';

import { generateDashboardData } from '@/data/mockData';

export default function HomePage() {
  const initialData = generateDashboardData();

  return (
    <main className="page">
      <header className="page__header">
        <h1>Company Dashboard</h1>
        <p>
          Explore sales, customer distribution, and user growth with interactive D3.js charts.
        </p>
      </header>
      <Dashboard initialData={initialData} />
      <footer className="page__footer">
        <span>Data is randomly generated for demo purposes.</span>
      </footer>
    </main>
  );
}
