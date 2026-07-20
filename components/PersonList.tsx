"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { Person } from "@/lib/types";
import { Avatar } from "./Avatar";

type PersonListProps = {
  people: Person[];
  onAdd: (name: string) => void;
  onRemove: (personId: string) => void;
};

export function PersonList({ people, onAdd, onRemove }: PersonListProps) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName("");
  };

  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        People
      </h2>

      {people.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {people.map((person) => (
            <span
              key={person.id}
              className="group flex items-center gap-2 rounded-full bg-zinc-100 py-1 pr-2 pl-1.5 text-sm font-medium text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-100"
            >
              <Avatar name={person.name} />
              {person.name}
              <button
                type="button"
                onClick={() => onRemove(person.id)}
                aria-label={`Remove ${person.name}`}
                className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a person"
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 active:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <UserPlus size={15} />
          Add
        </button>
      </div>
    </div>
  );
}
