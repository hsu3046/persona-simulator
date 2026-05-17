"use client";

import { useState } from "react";
import {
  ArrowsClockwiseIcon,
  PackageIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  CardGrid,
  EmptyState,
  PageHeader,
  PageLoading,
  PageShell,
} from "@/components/page-shell";

import { ProductCard } from "@/components/product/product-card";
import { ProductFormSheet } from "@/components/product/product-form-sheet";
import { useProductStore } from "@/stores/products";
import type { Product } from "@/types";

function newProductId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `prod-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `prod-${Math.random().toString(36).slice(2, 10)}`;
}

const EMPTY_PRODUCT_DEFAULTS: Omit<Product, "id"> = {
  name: "",
  category: "",
  price_krw: 0,
  positioning: "",
  unique_value_props: [],
  channels: [],
  competitor_brands: [],
  brand_color: "#FF8A65",
};

export default function ProductsPage() {
  const hydrated = useProductStore((s) => s.hydrated);
  const products = useProductStore((s) => s.products);
  const add = useProductStore((s) => s.add);
  const duplicate = useProductStore((s) => s.duplicate);
  const remove = useProductStore((s) => s.remove);
  const reset = useProductStore((s) => s.reset);
  const resetToMock = useProductStore((s) => s.resetToMock);

  const [editingId, setEditingId] = useState<string | null>(null);

  if (!hydrated) return <PageLoading />;

  const startCreate = () => {
    const id = newProductId();
    add({ id, ...EMPTY_PRODUCT_DEFAULTS });
    setEditingId(id);
  };

  return (
    <PageShell>
      <PageHeader
        phase="Phase 2 — 제품·서비스 / 캠페인"
        title="제품·서비스 / 캠페인"
        description="시뮬레이션 대상 제품·서비스와 광고 채널 plan 을 정의합니다. 채널별 크리에이티브와 타겟팅이 페르소나 노출 시뮬레이션의 입력이 됩니다."
        actions={
          <>
            {products.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("모든 제품·서비스를 삭제할까요?")) {
                    reset();
                    toast.success("모두 삭제되었습니다");
                  }
                }}
              >
                <TrashIcon weight="regular" className="size-4" />
                전체 삭제
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetToMock();
                toast.success("샘플 캠페인 로드", {
                  description: "Lumi Cashback 카드 (6 채널)",
                });
              }}
            >
              <ArrowsClockwiseIcon weight="regular" className="size-4" />
              샘플 로드
            </Button>
            <Button onClick={startCreate}>
              <SparkleIcon weight="fill" className="size-4" />
              제품·서비스 등록
            </Button>
          </>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          Icon={PackageIcon}
          title="아직 등록된 제품·서비스가 없습니다"
          description="제품·서비스 정보·채널·크리에이티브·타겟팅을 입력하면 시뮬레이션이 페르소나에게 어떻게 도달하는지 측정할 수 있습니다."
          primary={{
            label: "첫 제품·서비스 등록",
            onClick: startCreate,
            icon: SparkleIcon,
          }}
          secondary={{
            label: "샘플 캠페인 로드",
            onClick: () => {
              resetToMock();
              toast.success("샘플 캠페인 로드");
            },
            icon: ArrowsClockwiseIcon,
          }}
        />
      ) : (
        <CardGrid>
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              onEdit={() => setEditingId(p.id)}
              onDuplicate={() => {
                duplicate(p.id);
                toast.success(`${p.name} 복제됨`);
              }}
              onRemove={() => {
                if (confirm(`${p.name} 을(를) 삭제할까요?`)) {
                  remove(p.id);
                  toast.success(`${p.name} 삭제됨`);
                }
              }}
            />
          ))}
        </CardGrid>
      )}

      <ProductFormSheet
        open={editingId !== null}
        onOpenChange={(o) => {
          if (!o) {
            // 빈 상태로 닫으면 자동 정리
            const current = products.find((p) => p.id === editingId);
            if (current && !current.name.trim() && current.channels.length === 0) {
              remove(current.id);
            }
            setEditingId(null);
          }
        }}
        editingId={editingId}
      />
    </PageShell>
  );
}
