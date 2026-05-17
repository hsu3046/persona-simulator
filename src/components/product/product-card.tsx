"use client";

import { motion } from "motion/react";
import {
  CopyIcon,
  DotsThreeIcon,
  PackageIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CHANNEL_META } from "@/lib/channel-meta";
import { formatKRW } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({
  product,
  index = 0,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  product: Product;
  index?: number;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
}) {
  const totalSpend = product.channels.reduce((s, c) => s + c.spend_share, 0);
  const validSpend = Math.abs(totalSpend - 1) < 0.01;
  const topChannel = [...product.channels].sort(
    (a, b) => b.spend_share - a.spend_share,
  )[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
    >
      <Card
        className="h-full overflow-hidden cursor-pointer transition-colors hover:border-primary/40"
        style={{
          borderTopColor: product.brand_color ?? "var(--primary)",
          borderTopWidth: 4,
        }}
        onClick={onEdit}
      >
        <CardContent className="p-5 space-y-4">
          <header className="flex items-start gap-3">
            <div
              className="shrink-0 size-12 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{
                background: product.brand_color ?? "var(--primary)",
              }}
              aria-hidden
            >
              <PackageIcon weight="fill" className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {product.name || "(이름 없음)"}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {product.category || "—"} ·{" "}
                {product.price_krw > 0 ? formatKRW(product.price_krw) : "무료/구독"}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="제품·서비스 메뉴"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DotsThreeIcon weight="bold" className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <PencilSimpleIcon weight="regular" className="size-4" />
                    편집
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <CopyIcon weight="regular" className="size-4" />
                    복제
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <TrashIcon weight="regular" className="size-4" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {product.positioning && (
            <p className="text-sm leading-relaxed line-clamp-2 italic text-muted-foreground">
              &ldquo;{product.positioning}&rdquo;
            </p>
          )}

          {product.unique_value_props.length > 0 && (
            <ul className="space-y-1 text-sm">
              {product.unique_value_props.slice(0, 3).map((v, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-1.5 text-foreground"
                >
                  <span className="text-primary">·</span>
                  <span className="line-clamp-1">{v}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>채널 plan ({product.channels.length})</span>
              <span
                className={cn(
                  "font-mono",
                  validSpend ? "text-muted-foreground" : "text-destructive",
                )}
              >
                spend {(totalSpend * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.channels.slice(0, 5).map((c) => {
                const meta = CHANNEL_META[c.channel];
                return (
                  <Badge
                    key={c.channel}
                    variant="outline"
                    className="gap-1 font-normal text-[10px]"
                    title={`${meta.label} · ${(c.spend_share * 100).toFixed(0)}%`}
                  >
                    <meta.Icon
                      weight="fill"
                      className={cn("size-3", meta.fgClass)}
                    />
                    <span>{(c.spend_share * 100).toFixed(0)}%</span>
                  </Badge>
                );
              })}
              {product.channels.length > 5 && (
                <Badge variant="outline" className="text-[10px]">
                  +{product.channels.length - 5}
                </Badge>
              )}
            </div>
            {topChannel && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                Top: {CHANNEL_META[topChannel.channel].label} —{" "}
                {topChannel.creative_summary || "(카피 없음)"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
