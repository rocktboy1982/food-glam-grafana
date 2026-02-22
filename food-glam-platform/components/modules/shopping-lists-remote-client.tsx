"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download } from "lucide-react";

type ShoppingList = {
  id: string;
  name: string;
  itemCount: number;
  createdDate: string;
};

type ShoppingItem = {
  id?: string;
  text: string;
  checked?: boolean;
};

export default function ShoppingListsRemoteClient() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("shopping_lists");
    if (saved) {
      try {
        setLists(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load shopping lists", e);
      }
    }
  }, []);

  const createList = () => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: `Shopping List ${lists.length + 1}`,
      itemCount: 0,
      createdDate: new Date().toISOString().split("T")[0],
    };
    const updated = [...lists, newList];
    setLists(updated);
    localStorage.setItem("shopping_lists", JSON.stringify(updated));
  };

  const addItem = (listId: string) => {
    if (!newItemText.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      text: newItemText,
      checked: false,
    };
    setItems([...items, newItem]);
    setNewItemText("");
    setLists(lists.map(l => 
      l.id === listId ? { ...l, itemCount: l.itemCount + 1 } : l
    ));
  };

  const deleteList = (listId: string) => {
    const updated = lists.filter(l => l.id !== listId);
    setLists(updated);
    localStorage.setItem("shopping_lists", JSON.stringify(updated));
    if (expandedListId === listId) setExpandedListId(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shopping Lists</h2>
        <Button onClick={createList} className="gap-2">
          <Plus className="w-4 h-4" /> New List
        </Button>
      </div>
      {lists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No shopping lists yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer hover:shadow-md"
              onClick={() => setExpandedListId(expandedListId === list.id ? null : list.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{list.name}</CardTitle>
                    <p className="text-sm text-gray-500">{list.itemCount} items</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
