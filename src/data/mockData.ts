export type MonthlySales = {
  month: string;
  sales: number;
};

export type ClientDistribution = {
  region: string;
  clients: number;
};

export type UserGrowth = {
  month: string;
  users: number;
};

export type DashboardData = {
  sales: MonthlySales[];
  clients: ClientDistribution[];
  users: UserGrowth[];
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const REGIONS = ['North', 'West', 'Central', 'East', 'South'];

const pickRandomGrowth = () => 0.15 + Math.random() * 0.45;

export const generateDashboardData = (): DashboardData => {
  const sales = MONTHS.map((month) => ({
    month,
    sales: Math.round(20000 + Math.random() * 30000),
  }));

  const base = Math.round(1200 + Math.random() * 600);
  const users = MONTHS.map((month, index) => ({
    month,
    users: Math.round(base * (1 + pickRandomGrowth() * index)),
  }));

  const rawClients = REGIONS.map(() => 30 + Math.random() * 70);
  const totalClients = rawClients.reduce((acc, value) => acc + value, 0);
  const clients = rawClients.map((value, index) => ({
    region: REGIONS[index],
    clients: Math.round((value / totalClients) * 1000),
  }));

  return { sales, clients, users };
};

