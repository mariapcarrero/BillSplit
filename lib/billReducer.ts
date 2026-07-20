import type { Bill, BillItem } from "./types";
import { generateId } from "./id";

export type BillAction =
  | { type: "SET_TITLE"; title: string }
  | { type: "ADD_PERSON"; name: string }
  | { type: "REMOVE_PERSON"; personId: string }
  | { type: "RENAME_PERSON"; personId: string; name: string }
  | { type: "ADD_ITEM" }
  | { type: "UPDATE_ITEM"; itemId: string; patch: Partial<Omit<BillItem, "id">> }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "ADD_AI_ITEMS"; items: Omit<BillItem, "id">[] }
  | { type: "LOAD_BILL"; bill: Bill };

export function createEmptyBill(): Bill {
  return { title: "New bill", people: [], items: [] };
}

export function billReducer(state: Bill, action: BillAction): Bill {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.title };

    case "ADD_PERSON": {
      const name = action.name.trim();
      if (!name) return state;
      return { ...state, people: [...state.people, { id: generateId(), name }] };
    }

    case "REMOVE_PERSON": {
      const people = state.people.filter((p) => p.id !== action.personId);
      const items = state.items
        .filter((item) => item.paidBy !== action.personId)
        .map((item) => ({
          ...item,
          splitAmong: item.splitAmong.filter((id) => id !== action.personId),
        }))
        .filter((item) => item.splitAmong.length > 0);
      return { ...state, people, items };
    }

    case "RENAME_PERSON":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.personId ? { ...p, name: action.name } : p,
        ),
      };

    case "ADD_ITEM": {
      if (state.people.length === 0) return state;
      const newItem: BillItem = {
        id: generateId(),
        description: "",
        amount: 0,
        paidBy: state.people[0].id,
        splitAmong: state.people.map((p) => p.id),
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? { ...item, ...action.patch } : item,
        ),
      };

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((item) => item.id !== action.itemId) };

    case "ADD_AI_ITEMS":
      return {
        ...state,
        items: [...state.items, ...action.items.map((item) => ({ ...item, id: generateId() }))],
      };

    case "LOAD_BILL":
      return action.bill;

    default:
      return state;
  }
}
