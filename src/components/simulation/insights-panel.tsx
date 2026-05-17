"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  ChartBarIcon,
  LightbulbFilamentIcon,
  ListBulletsIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { FunnelMini } from "./funnel-mini";
import { InsightsCards } from "./insights-cards";
import { ReachChart } from "./reach-chart";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function InsightsPanel({ collapsed, onToggle }: Props) {
  if (collapsed) {
    return (
      <aside className="w-9 shrink-0 border-l bg-card/40 flex flex-col items-center pt-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label="인사이트 패널 열기"
        >
          <CaretLeftIcon weight="bold" className="size-4" />
        </Button>
        <div className="mt-3 flex flex-col items-center gap-3 text-muted-foreground">
          <ChartBarIcon weight="regular" className="size-4" />
          <ListBulletsIcon weight="regular" className="size-4" />
          <LightbulbFilamentIcon weight="regular" className="size-4" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l bg-card/40 flex flex-col min-h-0">
      <Tabs defaultValue="reach" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mx-3 mt-3">
          <TabsList className="grid grid-cols-3 flex-1">
            <TabsTrigger value="reach">
              <ChartBarIcon weight="regular" className="size-3.5" />
              Reach
            </TabsTrigger>
            <TabsTrigger value="funnel">
              <ListBulletsIcon weight="regular" className="size-3.5" />
              Funnel
            </TabsTrigger>
            <TabsTrigger value="insights">
              <LightbulbFilamentIcon weight="regular" className="size-3.5" />
              Insight
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label="인사이트 패널 접기"
            className="shrink-0"
          >
            <CaretRightIcon weight="bold" className="size-4" />
          </Button>
        </div>

        <TabsContent
          value="reach"
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ReachChart />
        </TabsContent>
        <TabsContent
          value="funnel"
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <FunnelMini />
        </TabsContent>
        <TabsContent
          value="insights"
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <InsightsCards />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
