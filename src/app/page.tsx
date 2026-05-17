import Link from "next/link";
import { ArrowRightIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex-1 container max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-spark/30 text-spark-foreground px-4 py-1.5 text-sm font-medium mb-6">
          <SparkleIcon weight="fill" className="size-4" />
          AI 페르소나 라이프 시뮬레이터
        </div>

        <h1 className="text-balance text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl">
          가상 고객의 하루를
          <br />
          영화처럼 재생합니다.
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base md:text-lg text-muted-foreground">
          마케팅·비즈니스 의사결정을 위한 AI 페르소나 시뮬레이션. 페르소나가 우리
          제품·서비스와 광고에 어떻게 도달하고, 도달 후 어떻게 사고·행동하는지 —
          일기까지 — 살펴봅니다.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/simulation" />}
          >
            시뮬레이션 시작
            <ArrowRightIcon weight="bold" className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/personas" />}
          >
            페르소나 만들기
          </Button>
        </div>
      </div>
    </main>
  );
}
