export type Person = {
  id: string;
  name: string;
};

export type BillItem = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
};

export type Bill = {
  title: string;
  people: Person[];
  items: BillItem[];
};

export type Balance = {
  personId: string;
  amount: number;
};

export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export type SettleResult = {
  balances: Balance[];
  transfers: Transfer[];
};
