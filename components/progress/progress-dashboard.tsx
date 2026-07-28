"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalysisStats, KeywordStat, ScoreTimelinePoint } from "@/lib/analysis-stats";

export function ProgressDashboard({ stats }: { stats: AnalysisStats }) {
  if (stats.totalAnalyses === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Você ainda não fez nenhuma análise. Analise seu currículo com uma vaga
          para começar a acompanhar seu progresso.
        </CardContent>
      </Card>
    );
  }

  const maxRecurring = Math.max(...stats.topRecurringKeywords.map((k) => k.timesSeen), 1);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Análises realizadas" value={String(stats.totalAnalyses)} />
        <StatTile
          label="Compatibilidade média"
          value={stats.averageScore !== null ? `${stats.averageScore}%` : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução da compatibilidade</CardTitle>
          <CardDescription>
            Score de cada análise ao longo do tempo
            {stats.averageScore !== null ? ` — média de ${stats.averageScore}%` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.scoreTimeline.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Faça mais análises para ver a evolução ao longo do tempo.
            </p>
          ) : (
            <ScoreTimelineChart timeline={stats.scoreTimeline} averageScore={stats.averageScore} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <KeywordRankingCard
          title="Tecnologias mais recorrentes"
          description="Mais frequentes nas vagas que você analisou"
          keywords={stats.topRecurringKeywords}
          renderValue={(k) => `${k.timesSeen}x`}
          getFraction={(k) => k.timesSeen / maxRecurring}
        />
        <KeywordRankingCard
          title="Maior aderência"
          description="Tecnologias que você já domina com mais frequência"
          keywords={stats.topAdherenceKeywords}
          renderValue={(k) => `${k.matchRate}%`}
          getFraction={(k) => k.matchRate / 100}
        />
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-6">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
      </CardContent>
    </Card>
  );
}

function KeywordRankingCard({
  title,
  description,
  keywords,
  renderValue,
  getFraction,
}: {
  title: string;
  description: string;
  keywords: KeywordStat[];
  renderValue: (k: KeywordStat) => string;
  getFraction: (k: KeywordStat) => number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {keywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {keywords.map((k) => (
              <div key={k.keyword} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{k.keyword}</span>
                  <span className="text-muted-foreground">{renderValue(k)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                    style={{ width: `${Math.max(getFraction(k) * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 240;
const PADDING_LEFT = 32;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;
const INNER_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const INNER_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const Y_TICKS = [0, 25, 50, 75, 100];

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function ScoreTimelineChart({
  timeline,
  averageScore,
}: {
  timeline: ScoreTimelinePoint[];
  averageScore: number | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = timeline.map((point, index) => {
    const x =
      timeline.length === 1
        ? PADDING_LEFT + INNER_WIDTH / 2
        : PADDING_LEFT + (index / (timeline.length - 1)) * INNER_WIDTH;
    const y = PADDING_TOP + INNER_HEIGHT - (point.score / 100) * INNER_HEIGHT;
    return { ...point, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const averageY =
    averageScore !== null
      ? PADDING_TOP + INNER_HEIGHT - (averageScore / 100) * INNER_HEIGHT
      : null;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;

    let closestIndex = 0;
    let closestDistance = Infinity;
    points.forEach((p, i) => {
      const distance = Math.abs(p.x - pointerX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });
    setHoverIndex(closestIndex);
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {Y_TICKS.map((tick) => {
          const y = PADDING_TOP + INNER_HEIGHT - (tick / 100) * INNER_HEIGHT;
          return (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PADDING_LEFT - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {averageY !== null && (
          <line
            x1={PADDING_LEFT}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y1={averageY}
            y2={averageY}
            className="stroke-muted-foreground/50"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        <path
          d={linePath}
          fill="none"
          className="stroke-blue-600 dark:stroke-blue-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.analysisId}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 || i === hoverIndex ? 5 : 3}
            className="fill-blue-600 stroke-card dark:fill-blue-400"
            strokeWidth={2}
          />
        ))}

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PADDING_TOP}
            y2={CHART_HEIGHT - PADDING_BOTTOM}
            className="stroke-muted-foreground/40"
            strokeWidth={1}
          />
        )}

        <text
          x={points[0].x}
          y={CHART_HEIGHT - 6}
          textAnchor="start"
          className="fill-muted-foreground text-[10px]"
        >
          {formatDate(points[0].createdAt)}
        </text>
        {points.length > 1 && (
          <text
            x={points[points.length - 1].x}
            y={CHART_HEIGHT - 6}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {formatDate(points[points.length - 1].createdAt)}
          </text>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-sm"
          style={{
            left: `${(hovered.x / CHART_WIDTH) * 100}%`,
            top: `${(hovered.y / CHART_HEIGHT) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <p className="font-semibold text-popover-foreground">{hovered.score}%</p>
          <p className="text-muted-foreground">{formatDate(hovered.createdAt)}</p>
        </div>
      )}
    </div>
  );
}
