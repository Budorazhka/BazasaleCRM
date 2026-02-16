"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: страница аналитики человека; здесь ты собираешь персональные KPI, эффективность и блоки графиков.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.


import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityCalendarCard } from "@/components/analytics-network/activity-calendar-card";
import { ActivityChart } from "@/components/analytics-network/activity-chart";
import { ActivityComposition, ActivityQuoteCard } from "@/components/analytics-network/activity-composition";
import { DynamicKpiCards } from "@/components/analytics-network/dynamic-kpi-cards";
import { FunnelKanban } from "@/components/analytics-network/funnel-kanban";
import { LeadsChart } from "@/components/analytics-network/leads-chart";
import { PersonalAnalyticsInsights } from "@/components/analytics-network/personal-analytics-insights";
import { PeriodTabs } from "@/components/analytics-network/period-tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPeriodDateRange, getPersonAnalyticsData } from "@/lib/mock/analytics-network";
import { cn } from "@/lib/utils";
import type { AnalyticsPeriod, FunnelBoard } from "@/types/analytics";
import { AnalyticsNavLinks } from "@/components/app-header";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

interface PersonAnalyticsPageProps {
    personId: string;
    mode: "me" | "partner";
}

export function PersonAnalyticsPage({ personId, mode }: PersonAnalyticsPageProps) {
    const [globalPeriod, setGlobalPeriod] = useState<AnalyticsPeriod>("week");
    const [leadsPeriod, setLeadsPeriod] = useState<AnalyticsPeriod>("week");
    const [activityPeriod, setActivityPeriod] = useState<AnalyticsPeriod>("week");

    const globalData = useMemo(() => getPersonAnalyticsData(personId, globalPeriod), [personId, globalPeriod]);
    const todayData = useMemo(() => getPersonAnalyticsData(personId, "week"), [personId]);
    const leadsData = useMemo(
        () => getPersonAnalyticsData(personId, leadsPeriod)?.leadsTimeseries ?? [],
        [personId, leadsPeriod]
    );
    const activityData = useMemo(
        () => getPersonAnalyticsData(personId, activityPeriod)?.activityTimeseries ?? [],
        [personId, activityPeriod]
    );
    const monthCalendarData = useMemo(
        () => getPersonAnalyticsData(personId, "month")?.activityTimeseries ?? [],
        [personId]
    );
    const allTimeCalendarData = useMemo(
        () => getPersonAnalyticsData(personId, "allTime")?.activityTimeseries ?? [],
        [personId]
    );
    const range = useMemo(() => getPeriodDateRange(globalPeriod), [globalPeriod]);
    const monthRangeForCalendar = useMemo(() => getPeriodDateRange("month"), []);
    const rangeLabel = useMemo(() => {
        const formatter = new Intl.DateTimeFormat("ru-RU", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        return `${formatter.format(range.start)} - ${formatter.format(range.end)}`;
    }, [range]);

    if (!globalData) {
        return (
            <div className="mx-auto w-full max-w-4xl p-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-base font-medium">Сотрудник не найден</p>
                        <p className="text-sm text-muted-foreground">
                            Проверьте корректность ссылки или выберите сотрудника из таблицы аналитики сети.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const person = globalData.person;
    const salesFunnel = globalData.funnels.find((funnel) => funnel.id === "sales") ?? globalData.funnels[0];
    const isMeMode = mode === "me";
    const title = isMeMode ? "Аналитика меня" : "Аналитика партнёра";
    const statusText = person.isOnline ? "Онлайн" : `Был в сети ${formatLastSeen(person.lastSeenMinutesAgo)}`;

    return (
        <div className="w-full max-w-full space-y-4 overflow-x-hidden px-3 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0 ring-2 ring-border/50">
                        <AvatarImage src={person.avatarUrl} alt={person.name} />
                        <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{title}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                            <span>{rangeLabel}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-xl font-medium sm:text-2xl">{person.name}</h1>
                            <Badge variant="outline" className="text-xs">
                                {globalData.periodLabel}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{statusText}</p>
                    </div>
                </div>
                <div className="flex min-w-0 flex-1 justify-center">
                    <AnalyticsNavLinks />
                </div>
                <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
                    <Button
                        asChild
                        size="sm"
                        className="border border-emerald-500/35 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 dark:text-emerald-300"
                    >
                        <Link href="/analytics" className="inline-flex items-center gap-1.5">
                            <ArrowLeft className="size-4" />
                            <span className="hidden sm:inline">Вернуться в</span> CRM
                        </Link>
                    </Button>
                    <PeriodTabs selectedPeriod={globalPeriod} onPeriodChange={setGlobalPeriod} />
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
                <div className="flex min-w-0 flex-col gap-4">
                    <PersonalSalesSummary
                        title={isMeMode ? "Личные итоги" : "Итоги партнёра"}
                        totalLeads={globalData.staticKpi.totalLeads}
                        totalDeals={globalData.staticKpi.totalDeals}
                        partnersCount={globalData.staticKpi.level1Referrals}
                        level2Referrals={person.level2Count}
                        totalListings={globalData.staticKpi.totalListings}
                        onlineDays={person.onlineDaysLast7}
                    />

                    <DynamicKpiCards
                        data={globalData.dynamicKpi}
                        todayData={todayData?.dynamicKpi}
                        periodLabel={globalData.periodLabel}
                        variant="directOnly"
                    />
                    <ActivityComposition data={globalData.dynamicKpi} />
                    <ActivityQuoteCard className="flex-1" quoteUserKey={personId} />
                </div>

                <div className="min-w-0 space-y-4">
                    {isMeMode ? (
                        <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_280px]">
                            <ActivityCalendarCard
                                period={globalPeriod}
                                range={range}
                                monthRange={monthRangeForCalendar}
                                monthData={monthCalendarData}
                                allTimeData={allTimeCalendarData}
                                className="w-full"
                                highContrast
                            />
                            <ActivityProfileCard monthData={monthCalendarData} />
                        </div>
                    ) : (
                        <DirectActionsCard data={globalData.dynamicKpi} salesFunnel={salesFunnel} />
                    )}
                    <PersonalAnalyticsInsights
                        dynamicKpi={globalData.dynamicKpi}
                        funnels={globalData.funnels}
                        period={globalPeriod}
                        allowPlanEditing={isMeMode}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <LeadsChart data={leadsData} period={leadsPeriod} onPeriodChange={setLeadsPeriod} />
                <ActivityChart data={activityData} period={activityPeriod} onPeriodChange={setActivityPeriod} />
            </div>

            <FunnelKanban funnels={globalData.funnels} />
        </div>
    );
}

function PersonalSalesSummary({
    title,
    totalLeads,
    totalDeals,
    partnersCount,
    level2Referrals,
    totalListings,
    onlineDays,
}: {
    title: string;
    totalLeads: number;
    totalDeals: number;
    partnersCount: number;
    level2Referrals: number;
    totalListings: number;
    onlineDays: number;
}) {
    const cards = [
        { label: "Лиды всего", value: totalLeads },
        { label: "Сделки всего", value: totalDeals },
        { label: "Партнёры", value: partnersCount },
        { label: "Рефералы L2", value: level2Referrals },
        { label: "Объекты", value: totalListings },
        { label: "Онлайн за неделю", value: onlineDays, suffix: "/7" },
    ];

    return (
        <Card>
            <CardHeader className="pb-2 text-center">
                <CardTitle className="text-center text-base font-medium sm:text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-lg font-medium">
                            {card.value.toLocaleString("ru-RU")}
                            {card.suffix ?? ""}
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function DirectActionsCard({
    data,
    salesFunnel,
}: {
    data: {
        addedLeads: number;
        callClicks: number;
        chatOpens: number;
        selectionsCreated: number;
        deals: number;
    };
    salesFunnel: FunnelBoard;
}) {
    const totalTouches = data.callClicks + data.chatOpens + data.selectionsCreated;
    const funnelMoves = Math.max(0, Math.round(data.addedLeads * 1.6 + data.selectionsCreated * 0.5));
    const leadToPresentation = calculateFunnelConversion(salesFunnel, "Новый лид", "Презентовали компанию");
    const presentationToShowing = calculateFunnelConversion(salesFunnel, "Презентовали компанию", "Показ");
    const showingToDeal = calculateFunnelConversion(salesFunnel, "Показ", "Заключен договор");
    const leadToDeal = calculateFunnelConversion(salesFunnel, "Новый лид", "Заключен договор");
    const touchToDeal = totalTouches > 0 ? Math.round((data.deals / totalTouches) * 100) : 0;
    const touchesPerDeal = data.deals > 0 ? totalTouches / data.deals : null;
    const touchesPerDealLabel = touchesPerDeal
        ? new Intl.NumberFormat("ru-RU", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
          }).format(touchesPerDeal)
        : null;
    const touchToDealTone =
        touchToDeal >= 12
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
            : touchToDeal >= 6
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700";
    const touchToDealGrade = touchToDeal >= 12 ? "Сильный" : touchToDeal >= 6 ? "Средний" : "Низкий";
    const metricHints = {
        addedLeads:
            "Сколько новых лидов добавили за выбранный период. Лид — это новый клиент в работе.",
        totalTouches:
            "Все активности с лидами: звонки + чаты + рассылки. Считается как сумма этих трех каналов.",
        deals:
            "Сколько сделок дошло до финального этапа за выбранный период.",
        funnelMoves:
            "Движение по воронке = только шаги вперед к сделке. Отказы и возврат на прошлые этапы не учитываются. Считается как показатель Прогресс в таблице аналитики сети.",
        leadToPresentation:
            "Из всех новых лидов сколько дошли до презентации. Формула: этап 'Презентация' / этап 'Новый лид' x 100%.",
        presentationToShowing:
            "Из всех презентаций сколько дошли до показа. Формула: этап 'Показ' / этап 'Презентация' x 100%.",
        showingToDeal:
            "Из всех показов сколько завершились сделкой. Формула: этап 'Сделка' / этап 'Показ' x 100%.",
        leadToDeal:
            "Из всех новых лидов сколько дошли до сделки. Формула: этап 'Сделка' / этап 'Новый лид' x 100%.",
        touchToDeal:
            "Из всех активностей сколько в итоге дали сделку. Формула: сделки / все активности x 100%.",
        calls:
            "Сколько было звонков. Процент ниже — доля звонков от всех активностей.",
        chats:
            "Сколько было чатов. Процент ниже — доля чатов от всех активностей.",
        selections:
            "Сколько отправили рассылок. Процент ниже — доля рассылок от всех активностей.",
    };
    const conversionMetrics = [
        {
            key: "leadToPresentation",
            label: "Лид → Презент.",
            value: leadToPresentation,
            color: "hsl(214, 84%, 56%)",
            hint: metricHints.leadToPresentation,
        },
        {
            key: "presentationToShowing",
            label: "Презент. → Показ",
            value: presentationToShowing,
            color: "hsl(195, 92%, 45%)",
            hint: metricHints.presentationToShowing,
        },
        {
            key: "showingToDeal",
            label: "Показ → Сделка",
            value: showingToDeal,
            color: "hsl(152, 72%, 37%)",
            hint: metricHints.showingToDeal,
        },
        {
            key: "leadToDeal",
            label: "Лид → Сделка",
            value: leadToDeal,
            color: "hsl(42, 95%, 50%)",
            hint: metricHints.leadToDeal,
        },
        {
            key: "touchToDeal",
            label: "Актив. → Сделка",
            value: touchToDeal,
            color: "hsl(280, 65%, 57%)",
            hint: metricHints.touchToDeal,
        },
    ];
    const efficiencyMetrics = [
        {
            key: "addedLeads",
            label: "Новые лиды",
            value: data.addedLeads,
            color: "hsl(187, 85%, 53%)",
            hint: metricHints.addedLeads,
        },
        {
            key: "totalTouches",
            label: "Активности",
            value: totalTouches,
            color: "hsl(25, 95%, 53%)",
            hint: metricHints.totalTouches,
        },
        {
            key: "funnelMoves",
            label: "Движение по воронке",
            value: funnelMoves,
            color: "hsl(145, 72%, 38%)",
            hint: metricHints.funnelMoves,
        },
    ];
    const efficiencyMaxValue = Math.max(...efficiencyMetrics.map((metric) => metric.value), 1);
    const conversionChartConfig = conversionMetrics.reduce<ChartConfig>((acc, metric) => {
        acc[metric.key] = {
            label: metric.label,
            color: metric.color,
        };
        return acc;
    }, {});
    const efficiencyChartConfig = efficiencyMetrics.reduce<ChartConfig>((acc, metric) => {
        acc[metric.key] = {
            label: metric.label,
            color: metric.color,
        };
        return acc;
    }, {});

    return (
        <Card>
            <CardHeader className="pb-2 text-center">
                <CardTitle className="text-center text-base font-medium sm:text-lg">Эффективность за период</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
                <div className="grid gap-3 sm:grid-cols-3">
                    {efficiencyMetrics.map((metric) => {
                        const fillPercent = Math.round((metric.value / efficiencyMaxValue) * 100);
                        return (
                            <div key={metric.key} className="rounded-lg border p-3 text-center">
                                <p className="text-sm text-muted-foreground">
                                    <MetricTooltipLabel label={metric.label} hint={metric.hint} />
                                </p>
                                <p className="text-xl font-medium sm:text-2xl">{metric.value.toLocaleString("ru-RU")}</p>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${fillPercent}%`, backgroundColor: metric.color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-lg border p-3">
                        <p className="mb-3 text-center text-xs font-medium text-muted-foreground">Конверсии воронки</p>
                        <ChartContainer config={conversionChartConfig} className="h-[230px] w-full">
                            <BarChart
                                data={conversionMetrics}
                                layout="vertical"
                                margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
                            >
                                <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}%`}
                                    fontSize={11}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    width={126}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10 }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name) => (
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">{name}</span>
                                                    <span className="font-mono font-medium">{Number(value)}%</span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Bar dataKey="value" radius={6}>
                                    <LabelList
                                        dataKey="value"
                                        position="right"
                                        formatter={(value: number) => `${value}%`}
                                        className="fill-foreground text-[11px]"
                                    />
                                    {conversionMetrics.map((metric) => (
                                        <Cell key={metric.key} fill={metric.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {conversionMetrics.map((metric) => (
                                <div key={metric.key} className="flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
                                    <span className="truncate text-[11px] text-muted-foreground">
                                        <MetricTooltipLabel label={metric.label} hint={metric.hint} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border p-3">
                        <p className="mb-3 text-center text-xs font-medium text-muted-foreground">Эффективность действий</p>
                        <ChartContainer config={efficiencyChartConfig} className="h-[230px] w-full">
                            <BarChart data={efficiencyMetrics} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                <YAxis tickLine={false} axisLine={false} width={35} tick={{ fontSize: 11 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={8}>
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        formatter={(value: number) => value.toLocaleString("ru-RU")}
                                        className="fill-foreground text-[11px]"
                                    />
                                    {efficiencyMetrics.map((metric) => (
                                        <Cell key={metric.key} fill={metric.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                        <div className="mt-3 rounded-md border bg-muted/20 px-3 py-2.5">
                            <p className="text-[11px] text-muted-foreground">
                                <MetricTooltipLabel label="КПА: Актив. → Сделка" hint={metricHints.touchToDeal} />
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-[hsl(280,65%,57%)] transition-all"
                                        style={{ width: `${touchToDeal}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium">{touchToDeal}%</span>
                                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", touchToDealTone)}>
                                    {touchToDealGrade}
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                {touchesPerDealLabel
                                    ? `В среднем 1 сделка на ${touchesPerDealLabel} активностей.`
                                    : "Пока нет сделок за период, поэтому коэффициент не набран."}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function getStageCumulativeCount(board: FunnelBoard, stageName: string): number {
    let count = 0;
    let found = false;
    const flowColumnIds = ["in_progress", "active", "success"];

    for (const columnId of flowColumnIds) {
        const column = board.columns.find((item) => item.id === columnId);
        if (!column) continue;

        for (const stage of column.stages) {
            if (stage.name === stageName) {
                found = true;
            }
            if (found) {
                count += stage.count;
            }
        }
    }

    return count;
}

function calculateFunnelConversion(board: FunnelBoard, fromStage: string, toStage: string): number {
    const fromCount = getStageCumulativeCount(board, fromStage);
    const toCount = getStageCumulativeCount(board, toStage);
    if (fromCount === 0) return 0;
    return Math.round((toCount / fromCount) * 100);
}

function MetricTooltipLabel({ label, hint }: { label: string; hint: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    className="cursor-help decoration-dotted underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    tabIndex={0}
                >
                    {label}
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-[260px] text-center leading-relaxed">
                {hint}
            </TooltipContent>
        </Tooltip>
    );
}

function ActivityProfileCard({
    monthData,
}: {
    monthData: { calls: number; chats: number; selections: number }[];
}) {
    const now = new Date();
    const currentDay = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth();

    const pastEntries = monthData.slice(0, currentDay);
    const dailyTotals = pastEntries.map((p) => p.calls + p.chats + p.selections);
    const total = dailyTotals.reduce((s, v) => s + v, 0);
    const avg = dailyTotals.length > 0 ? total / dailyTotals.length : 0;
    const best = Math.max(...dailyTotals, 0);

    const ACTIVE_THRESHOLD = 5;

    let streak = 0;
    for (let i = dailyTotals.length - 1; i >= 0; i--) {
        if (dailyTotals[i] >= ACTIVE_THRESHOLD) streak++;
        else break;
    }

    // Current week (Mon–Sun) for the streak tracker
    const todayDow = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Пн .. 6=Вс
    const mondayDate = new Date(year, month, currentDay - todayDow);
    const weekDowLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const weekDays: { day: number; status: "active" | "inactive" | "future"; total: number; label: string; dow: string }[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
        const dayIndex = d.getDate() - 1; // index in monthData
        const isFuture = d > now;
        const isInMonth = d.getMonth() === month && d.getFullYear() === year;
        const dayTotal = isInMonth && dayIndex >= 0 && dayIndex < dailyTotals.length ? dailyTotals[dayIndex] : 0;
        const dayLabel = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        weekDays.push({
            day: d.getDate(),
            status: isFuture ? "future" : dayTotal >= ACTIVE_THRESHOLD ? "active" : "inactive",
            total: isFuture ? 0 : dayTotal,
            label: dayLabel,
            dow: weekDowLabels[i],
        });
    }

    const dowTotals = Array(7).fill(0) as number[];
    const dowCounts = Array(7).fill(0) as number[];
    pastEntries.forEach((_, i) => {
        const d = new Date(year, month, i + 1);
        const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
        dowTotals[dow] += dailyTotals[i];
        dowCounts[dow]++;
    });
    const dowAvg = dowTotals.map((t, i) => (dowCounts[i] > 0 ? t / dowCounts[i] : 0));
    const dowLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const maxDowAvg = Math.max(...dowAvg, 1);

    const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

    const hints = {
        avg: "Среднее количество активностей (звонки + чаты + рассылки) за 1 день текущего месяца.",
        best: "Максимальное количество активностей, сделанных за 1 день в текущем месяце.",
        streak: `Сколько дней подряд (с сегодня назад) вы выполняли ${ACTIVE_THRESHOLD}+ активностей. Как в Duolingo — не пропускайте дни!`,
        dow: "Сколько в среднем активностей вы делаете в каждый день недели. Считается по всем понедельникам, вторникам и т.д. за месяц. Подсвечен самый продуктивный день.",
        streakRow: `Текущая неделя. Зелёный огонёк = ${ACTIVE_THRESHOLD}+ активностей за день, синий крестик = меньше ${ACTIVE_THRESHOLD}. Серый = день ещё не наступил.`,
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-center text-sm font-medium">
                    <MetricTooltipLabel
                        label="Профиль активности"
                        hint="Сводка вашей ежедневной активности за текущий месяц: средние показатели, рекорды и серия непрерывных дней."
                    />
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 pt-1">
                <div className="rounded-md border bg-muted/20 px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground">
                        <MetricTooltipLabel label="Среднее за день" hint={hints.avg} />
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">{fmt.format(avg)}</p>
                    <p className="text-[11px] text-muted-foreground">активностей</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md border bg-muted/10 px-2.5 py-1.5 text-sm">
                        <span className="text-muted-foreground">
                            <MetricTooltipLabel label="Рекорд дня" hint={hints.best} />
                        </span>
                        <span className="font-medium tabular-nums">{best}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border bg-muted/10 px-2.5 py-1.5 text-sm">
                        <span className="text-muted-foreground">
                            <MetricTooltipLabel label="Серия" hint={hints.streak} />
                        </span>
                        <div className="flex items-center gap-1.5">
                            {streak > 0 && <Flame className="size-4 text-orange-500" />}
                            <span className="font-medium tabular-nums">{streak} дн.</span>
                        </div>
                    </div>
                </div>

                {/* Duolingo-style streak row */}
                <div className="space-y-1.5">
                    <p className="text-center text-[11px] text-muted-foreground">
                        <MetricTooltipLabel label="Трекер серии" hint={hints.streakRow} />
                    </p>
                    <div className="flex flex-wrap items-start justify-center gap-2">
                        {weekDays.map((d) => (
                            <Tooltip key={d.dow}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex flex-col items-center gap-1"
                                        aria-label={`${d.dow} ${d.label}: ${d.status === "future" ? "ещё не наступил" : `${d.total} активностей`}`}
                                    >
                                        <span className={cn(
                                            "text-[10px] font-medium leading-none",
                                            d.status === "active" ? "text-emerald-600 dark:text-emerald-400"
                                                : d.status === "inactive" ? "text-blue-500 dark:text-blue-400"
                                                : "text-muted-foreground/40"
                                        )}>
                                            {d.dow}
                                        </span>
                                        <div
                                            className={cn(
                                                "flex size-7 items-center justify-center rounded-full border-2 transition-colors",
                                                d.status === "active"
                                                    ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-500"
                                                    : d.status === "inactive"
                                                      ? "border-blue-400/40 bg-blue-500/10 text-blue-400"
                                                      : "border-dashed border-muted-foreground/20 bg-transparent text-muted-foreground/25"
                                            )}
                                        >
                                            {d.status === "active" ? (
                                                <Flame className="size-4" />
                                            ) : d.status === "inactive" ? (
                                                <X className="size-3.5" />
                                            ) : (
                                                <span className="text-[10px]">—</span>
                                            )}
                                        </div>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={4} className="text-center text-xs">
                                    <p className="font-medium">{d.dow}, {d.label}</p>
                                    {d.status === "future" ? (
                                        <p className="text-muted-foreground">Ещё не наступил</p>
                                    ) : (
                                        <>
                                            <p>{d.total} активностей</p>
                                            <p className={d.status === "active" ? "text-emerald-400" : "text-blue-400"}>
                                                {d.status === "active" ? "Норма выполнена" : "Норма не выполнена"}
                                            </p>
                                        </>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                <div className="mt-auto space-y-1.5">
                    <p className="text-center text-[11px] text-muted-foreground">
                        <MetricTooltipLabel label="Среднее по дням недели (за месяц)" hint={hints.dow} />
                    </p>
                    <div className="space-y-1">
                        {dowAvg.map((val, i) => {
                            const pct = maxDowAvg > 0 ? (val / maxDowAvg) * 100 : 0;
                            const isLeader = val === maxDowAvg && val > 0;
                            const isWeekend = i >= 5;
                            return (
                                <div key={dowLabels[i]} className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-5 shrink-0 text-[11px] tabular-nums",
                                        isLeader ? "font-semibold text-blue-600 dark:text-blue-400" : isWeekend ? "text-muted-foreground/60" : "text-muted-foreground"
                                    )}>
                                        {dowLabels[i]}
                                    </span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/40">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                isLeader
                                                    ? "bg-blue-500"
                                                    : isWeekend
                                                      ? "bg-blue-300/60 dark:bg-blue-700/40"
                                                      : "bg-blue-400/70 dark:bg-blue-600/60"
                                            )}
                                            style={{ width: `${Math.max(4, pct)}%` }}
                                        />
                                    </div>
                                    <span className={cn(
                                        "w-7 shrink-0 text-right text-[11px] tabular-nums",
                                        isLeader ? "font-semibold text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                                    )}>
                                        {fmt.format(val)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function formatLastSeen(minutes: number | null) {
    if (minutes === null) return "только что";
    if (minutes < 60) return `${minutes} мин назад`;
    return `${Math.floor(minutes / 60)} ч назад`;
}
