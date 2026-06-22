import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quick Comm Intel — RIO" },
      {
        name: "description",
        content:
          "RIO's Quick Commerce Intelligence dashboard — SKU x City performance across Zepto with filters for brand, category, city and date.",
      },
    ],
  }),
  component: Dashboard,
});
