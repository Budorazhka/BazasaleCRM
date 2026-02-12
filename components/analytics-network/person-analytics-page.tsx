"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: страница аналитики человека; здесь ты собираешь персональные KPI, эффективность и блоки графиков.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.


import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart } from "@/components/analytics-network/activity-chart";
import { ActivityComposition } from "@/components/analytics-network/activity-composition";
import { DynamicKpiCards } from "@/components/analytics-network/dynamic-kpi-cards";
import { FunnelKanban } from "@/components/analytics-network/funnel-kanban";
import { LeadsChart } from "@/components/analytics-network/leads-chart";
import { PersonalAnalyticsInsights } from "@/components/analytics-network/personal-analytics-insights";
import { PeriodTabs } from "@/components/analytics-network/period-tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPeriodDateRange, getPersonAnalyticsData } from "@/lib/mock/analytics-network";
import type { AnalyticsPeriod } from "@/types/analytics";
import { AnalyticsNavLinks } from "@/components/app-header";

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
    const range = useMemo(() => getPeriodDateRange(globalPeriod), [globalPeriod]);
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
                        <p className="text-base font-semibold">Сотрудник не найден</p>
                        <p className="text-sm text-muted-foreground">
                            Проверьте корректность ссылки или выберите сотрудника из таблицы аналитики сети.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const person = globalData.person;
    const isMeMode = mode === "me";
    const title = isMeMode ? "Аналитика меня" : "Аналитика партнёра";
    const statusText = person.isOnline ? "Онлайн" : `Был в сети ${formatLastSeen(person.lastSeenMinutesAgo)}`;

    return (
        <div className="w-full space-y-4 overflow-x-hidden px-3 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0 ring-2 ring-border/50">
                        <AvatarImage src={person.avatarUrl} alt={person.name} />
                        <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{title}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                            <span>{rangeLabel}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-2xl font-semibold">{person.name}</h1>
                            <Badge variant="outline" className="text-xs">
                                {globalData.periodLabel}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{statusText}</p>
                    </div>
                </div>
                <div className="flex flex-1 justify-center">
                    <AnalyticsNavLinks />
                </div>
                <div className="flex shrink-0">
                    <PeriodTabs selectedPeriod={globalPeriod} onPeriodChange={setGlobalPeriod} />
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                <div className="space-y-4 self-start lg:sticky lg:top-24">
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
                </div>

                <div>
                    <div className="space-y-4">
                        <DirectActionsCard data={globalData.dynamicKpi} />
                        <PersonalAnalyticsInsights
                            dynamicKpi={globalData.dynamicKpi}
                            activityData={globalData.activityTimeseries}
                            funnels={globalData.funnels}
                            period={globalPeriod}
                            range={range}
                            allowPlanEditing={isMeMode}
                        />
                    </div>
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
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-lg border p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">{card.label}</p>
                        <p className="text-lg font-semibold">
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
}: {
    data: {
        addedLeads: number;
        callClicks: number;
        chatOpens: number;
        selectionsCreated: number;
        deals: number;
    };
}) {
    const totalTouches = data.callClicks + data.chatOpens + data.selectionsCreated;
    const leadToDeal = data.addedLeads > 0 ? Math.round((data.deals / data.addedLeads) * 100) : 0;
    const touchToDeal = totalTouches > 0 ? Math.round((data.deals / totalTouches) * 100) : 0;
    const contactsPerLead = data.addedLeads > 0 ? (totalTouches / data.addedLeads).toFixed(1) : "0.0";
    const metricHints = {
        addedLeads:
            "Сколько новых лидов добавили за выбранный период. Лид — это новый клиент в работе.",
        totalTouches:
            "Все активности с лидами: звонки + чаты + подборки. Считается как сумма этих трех каналов.",
        deals:
            "Сколько сделок дошло до финального этапа за выбранный период.",
        leadToDeal:
            "Доля лидов, которые стали сделками. Формула: сделки / новые лиды x 100%.",
        touchToDeal:
            "Доля сделок от общего числа активностей. Формула: сделки / все активности x 100%.",
        contactsPerLead:
            "Сколько в среднем активностей нужно на один лид. Формула: все активности / новые лиды.",
        calls:
            "Сколько было звонков. Процент ниже — доля звонков от всех активностей.",
        chats:
            "Сколько было чатов. Процент ниже — доля чатов от всех активностей.",
        selections:
            "Сколько отправили подборок. Процент ниже — доля подборок от всех активностей.",
    };
    const channels = [
        { key: "calls", label: "Звонки", value: data.callClicks, hint: metricHints.calls },
        { key: "chats", label: "Чаты", value: data.chatOpens, hint: metricHints.chats },
        { key: "selections", label: "Подборки", value: data.selectionsCreated, hint: metricHints.selections },
    ];

    return (
        <Card>
            <CardHeader className="pb-2 text-center">
                <CardTitle className="text-sm">Эффективность за период</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">
                            <MetricTooltipLabel label="Новые лиды" hint={metricHints.addedLeads} />
                        </p>
                        <p className="text-lg font-semibold">{data.addedLeads.toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">
                            <MetricTooltipLabel label="Активностей" hint={metricHints.totalTouches} />
                        </p>
                        <p className="text-lg font-semibold">{totalTouches.toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-[11px] text-muted-foreground">
                            <MetricTooltipLabel label="Сделки" hint={metricHints.deals} />
                        </p>
                        <p className="text-lg font-semibold">{data.deals.toLocaleString("ru-RU")}</p>
                    </div>
                </div>

                <div className="rounded-lg border p-3">
                    <p className="mb-3 text-center text-xs font-medium text-muted-foreground">Конверсии и эффективность</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1 text-center">
                            <p className="text-[11px] text-muted-foreground">
                                <MetricTooltipLabel label="Лид -> Сделка" hint={metricHints.leadToDeal} />
                            </p>
                            <p className="text-lg font-semibold">{leadToDeal}%</p>
                        </div>
                        <div className="space-y-1 text-center">
                            <p className="text-[11px] text-muted-foreground">
                                <MetricTooltipLabel label="Активность -> Сделка" hint={metricHints.touchToDeal} />
                            </p>
                            <p className="text-lg font-semibold">{touchToDeal}%</p>
                        </div>
                        <div className="space-y-1 text-center">
                            <p className="text-[11px] text-muted-foreground">
                                <MetricTooltipLabel
                                    label="Среднее активностей на 1 лид"
                                    hint={metricHints.contactsPerLead}
                                />
                            </p>
                            <p className="text-lg font-semibold">{contactsPerLead}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border p-3">
                    <p className="mb-3 text-center text-xs font-medium text-muted-foreground">Каналы активностей</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {channels.map((channel) => {
                            const share = totalTouches > 0 ? Math.round((channel.value / totalTouches) * 100) : 0;
                            return (
                                <div key={channel.key} className="rounded-md bg-muted/40 p-2 text-center">
                                    <p className="text-[11px] text-muted-foreground">
                                        <MetricTooltipLabel label={channel.label} hint={channel.hint} />
                                    </p>
                                    <p className="text-base font-semibold">{channel.value.toLocaleString("ru-RU")}</p>
                                    <p className="text-[11px] text-muted-foreground">{share}% от активностей</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
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

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">
                {value.toLocaleString("ru-RU")}
                {suffix ?? ""}
            </p>
        </div>
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
