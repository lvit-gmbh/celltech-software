"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  value: string;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  value?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const transition = { type: "spring", bounce: 0, duration: 0.3 };

export function ExpandableTabs({
  tabs,
  value,
  onValueChange,
  className,
  defaultValue,
}: ExpandableTabsProps) {
  const [selectedValue, setSelectedValue] = React.useState<string>(
    value || defaultValue || tabs.find((t) => t.type !== "separator")?.value || ""
  );

  const currentValue = value !== undefined ? value : selectedValue;

  const handleSelect = (tabValue: string) => {
    if (value === undefined) {
      setSelectedValue(tabValue);
    }
    onValueChange?.(tabValue);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border/20" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-input bg-card/40 px-1.5 h-10 shadow-none dark:bg-card/30",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = currentValue === tab.value;

        return (
          <motion.button
            key={tab.value}
            onClick={() => handleSelect(tab.value)}
            transition={transition}
            className={cn(
              "relative flex items-center gap-1.5 text-sm font-medium transition-all duration-300 flex-shrink-0 h-7",
              isSelected
                ? "rounded-md bg-secondary dark:bg-zinc-800 px-3 text-foreground"
                : "rounded-md px-3 text-foreground/90 hover:text-foreground dark:text-foreground"
            )}
          >
            <Icon size={20} className="shrink-0" />
            <span className="overflow-hidden whitespace-nowrap">
              {tab.title}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}