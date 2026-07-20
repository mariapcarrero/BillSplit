export type Person = {
  id: string;
  name: string;
};

export type SplitMode = "equal" | "percentage";

export type BillItem = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  /** Defaults to "equal" when omitted. */
  splitMode?: SplitMode;
  /** personId -> percent (0-100), required when splitMode is "percentage". */
  splitPercentages?: Record<string, number>;
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
