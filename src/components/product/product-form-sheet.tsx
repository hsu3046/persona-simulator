"use client";

import {
  CheckCircleIcon,
  PackageIcon,
  SparkleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { EditableList } from "@/components/persona/editable-list";
import { ChannelPlanEditor } from "@/components/product/channel-plan-editor";

import { useProductStore } from "@/stores/products";
import type { Product } from "@/types";

export function ProductFormSheet({
  open,
  onOpenChange,
  editingId,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  editingId: string | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0"
      >
        {open && editingId ? (
          <ProductFormContent key={editingId} productId={editingId} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ProductFormContent({ productId }: { productId: string }) {
  const updateProduct = useProductStore((s) => s.update);
  const product = useProductStore((s) =>
    s.products.find((p) => p.id === productId) ?? null,
  );

  if (!product) return null;

  // 모든 set 은 inline — 즉시 store 에 반영.
  const set = <K extends keyof Product>(key: K, value: Product[K]) => {
    updateProduct(productId, { [key]: value } as Pick<Product, K>);
  };

  const totalSpend = product.channels.reduce((s, c) => s + c.spend_share, 0);
  const spendValid = Math.abs(totalSpend - 1) < 0.01;
  const ready = product.name.trim() && product.channels.length > 0 && spendValid;
  const isNew = !product.name.trim() && product.channels.length === 0;

  return (
    <>
      <SheetHeader className="pl-6 pr-12 pt-6 pb-4 border-b">
        <SheetTitle className="flex items-center gap-2">
          <PackageIcon weight="fill" className="size-5 text-primary" />
          {isNew ? "새 제품·서비스 / 캠페인" : "제품·서비스 / 캠페인 편집"}
        </SheetTitle>
        <SheetDescription>
          {isNew
            ? "기본 정보부터 채워나가세요. 모든 수정은 자동 저장됩니다."
            : "수정 사항은 자동 저장됩니다."}
        </SheetDescription>
        <div className="mt-2">
          {ready ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <CheckCircleIcon weight="fill" className="size-3 text-primary" />
              시뮬 준비 완료
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-[10px] text-destructive">
              <WarningCircleIcon weight="fill" className="size-3" />
              {!product.name.trim()
                ? "이름을 입력하세요"
                : product.channels.length === 0
                  ? "채널을 1개 이상 추가하세요"
                  : `채널 예산 합계가 ${(totalSpend * 100).toFixed(0)}% — 100% 가 되어야 시뮬 가능`}
            </Badge>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="px-6 py-6 space-y-7">
          <section className="space-y-4">
            <SectionTitle>기본 정보</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-name"
                  value={product.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Lumi Cashback 카드"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-category">카테고리</Label>
                <Input
                  id="p-category"
                  value={product.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="신용카드"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">가격 (KRW)</Label>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  value={product.price_krw}
                  onChange={(e) => set("price_krw", Number(e.target.value) || 0)}
                  placeholder="0 = 무료/구독없음"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-color">브랜드 컬러</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="p-color"
                    type="color"
                    value={product.brand_color ?? "#FF8A65"}
                    onChange={(e) => set("brand_color", e.target.value)}
                    className="h-9 w-12 p-1"
                  />
                  <Input
                    value={product.brand_color ?? ""}
                    onChange={(e) => set("brand_color", e.target.value)}
                    placeholder="#FF8A65"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-position">포지셔닝 한 줄</Label>
              <Input
                id="p-position"
                value={product.positioning}
                onChange={(e) => set("positioning", e.target.value)}
                placeholder="MZ 직장인을 위한 일상 캐시백 카드"
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <SectionTitle>핵심 가치 (USP)</SectionTitle>
            <EditableList
              items={product.unique_value_props}
              onChange={(next) => set("unique_value_props", next)}
              placeholder="예: 연회비 평생 무료"
              emptyLabel="USP 항목을 추가하세요."
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <SectionTitle>경쟁 브랜드</SectionTitle>
            <EditableList
              items={product.competitor_brands}
              onChange={(next) => set("competitor_brands", next)}
              placeholder="예: 현대카드 ZERO Edition2"
              emptyLabel="경쟁 브랜드를 추가하세요 (선택)."
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <SparkleIcon weight="duotone" className="size-4 text-primary" />
                Distinctive Brand Assets (DBA)
              </span>
            </SectionTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              페르소나가 0.2초 안에 우리 브랜드를 알아보게 하는 감각 신호. 입력
              개수가 많을수록 노출당 mental availability 누적이 빨라집니다.
              <a
                href="https://brandgenetics.com/human-thinking/how-brands-grow-speed-summary/"
                target="_blank"
                rel="noreferrer"
                className="underline ml-1 hover:text-foreground"
              >
                Byron Sharp 이론
              </a>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dba-color">시그니처 컬러</Label>
                <Input
                  id="dba-color"
                  value={product.distinctive_assets?.color ?? ""}
                  onChange={(e) =>
                    set("distinctive_assets", {
                      ...product.distinctive_assets,
                      color: e.target.value,
                    })
                  }
                  placeholder="예: 코카콜라 빨강"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dba-mascot">캐릭터 / 마스코트</Label>
                <Input
                  id="dba-mascot"
                  value={product.distinctive_assets?.mascot ?? ""}
                  onChange={(e) =>
                    set("distinctive_assets", {
                      ...product.distinctive_assets,
                      mascot: e.target.value,
                    })
                  }
                  placeholder="예: 두꺼비 (진로)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dba-tagline">시그니처 카피·태그라인</Label>
                <Input
                  id="dba-tagline"
                  value={product.distinctive_assets?.tagline ?? ""}
                  onChange={(e) =>
                    set("distinctive_assets", {
                      ...product.distinctive_assets,
                      tagline: e.target.value,
                    })
                  }
                  placeholder="예: I'm lovin' it"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dba-sound">효과음·징글</Label>
                <Input
                  id="dba-sound"
                  value={product.distinctive_assets?.sound ?? ""}
                  onChange={(e) =>
                    set("distinctive_assets", {
                      ...product.distinctive_assets,
                      sound: e.target.value,
                    })
                  }
                  placeholder="예: Intel inside 사운드"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dba-other">기타 (패키지·UI 패턴 등)</Label>
                <Input
                  id="dba-other"
                  value={product.distinctive_assets?.other ?? ""}
                  onChange={(e) =>
                    set("distinctive_assets", {
                      ...product.distinctive_assets,
                      other: e.target.value,
                    })
                  }
                  placeholder="예: 동그란 패키지, 굿모닝 알림 톤"
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <SectionTitle>광고 채널 plan</SectionTitle>
            <p className="text-xs text-muted-foreground">
              채널별 예산 비율과 크리에이티브, 타겟팅을 지정합니다. 시뮬레이션
              시 페르소나 미디어 습관과 매칭되어 노출 여부가 결정됩니다.
            </p>
            <ChannelPlanEditor
              channels={product.channels}
              onChange={(next) => set("channels", next)}
            />
          </section>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}
