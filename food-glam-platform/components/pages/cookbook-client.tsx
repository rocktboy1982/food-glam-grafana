"use client";

import React from "react";
import CollectionsRemoteClient from "@/components/modules/collections-remote-client";

export default function CookbookClient() {
  return (
    <main className="container mx-auto px-4 py-8 flex flex-col gap-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold mb-2">Your Cookbook</h1>
        <p className="text-muted-foreground mb-4">Saved recipes and collections for quick access.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Saved Recipes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Thai Green Curry", "Italian Risotto", "Moroccan Tagine"].map(recipe => (
            <div key={recipe} className="border rounded-lg p-4 flex flex-col items-center bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-1">{recipe}</h3>
              <div className="flex gap-2">
                <button className="bg-primary text-primary-foreground px-4 py-1 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Cook Now</button>
                <button className="bg-secondary text-secondary-foreground px-4 py-1 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Collections</h2>
        <div>
          {/* Replace static list with remote-backed collections component */}
          <CollectionsRemoteClient />
        </div>
      </section>
    </main>
  );
}
