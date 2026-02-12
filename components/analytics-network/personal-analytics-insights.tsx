"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: блок план/факт и подсказки по личной аналитике; здесь важно не ломать расчёт процентов и целей.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.


import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityTimeseriesPoint, AnalyticsPeriod, DynamicKpi, FunnelBoard } from "@/types/analytics";
import { cn } from "@/lib/utils";

interface PersonalAnalyticsInsightsProps {
    dynamicKpi: DynamicKpi;
    activityData: ActivityTimeseriesPoint[];
    funnels: FunnelBoard[];
    period: AnalyticsPeriod;
    range: { start: Date; end: Date };
    allowPlanEditing?: boolean;
}

type CalendarEntry = {
    key: string;
    labelShort: string;
    labelLong: string;
    dateNumber?: number;
    total: number;
    calls: number;
    chats: number;
    selections: number;
};

type PlanBucket = "week" | "month";
type PlanMetricKey = "leads" | "contacts" | "deals";
type PlanMetrics = Record<PlanMetricKey, number>;
type PlanTargetsByBucket = Record<PlanBucket, PlanMetrics>;

const PLAN_STORAGE_KEY = "analytics.personal.planTargets.v1";

const statusToneByColumn: Record<string, string> = {
    rejection: "bg-rose-500",
    in_progress: "bg-blue-500",
    preparation: "bg-amber-500",
    success: "bg-emerald-500",
    active: "bg-teal-500",
};

const metricLabels: Record<PlanMetricKey, string> = {
    leads: "\u041d\u043e\u0432\u044b\u0435 \u043b\u0438\u0434\u044b",
    contacts: "\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438",
    deals: "\u0421\u0434\u0435\u043b\u043a\u0438",
};

function normalizePlanValue(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.round(value));
}

function buildDefaultPlanTargets(dynamicKpi: DynamicKpi): PlanTargetsByBucket {
    const contacts = dynamicKpi.callClicks + dynamicKpi.chatOpens + dynamicKpi.selectionsCreated;
    const week: PlanMetrics = {
        leads: Math.max(dynamicKpi.addedLeads, 15),
        contacts: Math.max(contacts, 45),
        deals: Math.max(dynamicKpi.deals, 3),
    };

    return {
        week,
        month: {
            leads: Math.max(week.leads * 4, 60),
            contacts: Math.max(week.contacts * 4, 180),
            deals: Math.max(week.deals * 4, 12),
        },
    };
}

function mergePlanTargets(
    baseTargets: PlanTargetsByBucket,
    maybeStored: Partial<Record<PlanBucket, Partial<Record<PlanMetricKey, number>>>>
): PlanTargetsByBucket {
    return {
        week: {
            leads: normalizePlanValue(maybeStored.week?.leads ?? baseTargets.week.leads),
            contacts: normalizePlanValue(maybeStored.week?.contacts ?? baseTargets.week.contacts),
            deals: normalizePlanValue(maybeStored.week?.deals ?? baseTargets.week.deals),
        },
        month: {
            leads: normalizePlanValue(maybeStored.month?.leads ?? baseTargets.month.leads),
            contacts: normalizePlanValue(maybeStored.month?.contacts ?? baseTargets.month.contacts),
            deals: normalizePlanValue(maybeStored.month?.deals ?? baseTargets.month.deals),
        },
    };
}

function getProgressTone(percent: number) {
    if (percent >= 100) return "bg-emerald-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-rose-500";
}

function getDayIndexFromMonday(date: Date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

function getTrafficTone(total: number) {
    if (total === 0) {
        return {
            label: "\u041d\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439",
            className:
                "bg-rose-100/80 border-rose-300 text-rose-900 hover:bg-rose-100 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-200",
        };
    }

    if (total < 5) {
        return {
            label: "\u041d\u0438\u0437\u043a\u0430\u044f \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c",
            className:
                "bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-100 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-200",
        };
    }

    return {
        label: "\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0439 \u0434\u0435\u043d\u044c",
        className:
            "bg-emerald-100/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-200",
    };
}

function buildCalendarEntries(
    period: AnalyticsPeriod,
    range: { start: Date; end: Date },
    activityData: ActivityTimeseriesPoint[]
): CalendarEntry[] {
    if (period === "allTime") {
        return activityData.slice(-12).map((point, index) => ({
            key: `month-${index}`,
            labelShort: point.date,
            labelLong: point.date,
            total: point.calls + point.chats + point.selections,
            calls: point.calls,
            chats: point.chats,
            selections: point.selections,
        }));
    }

    const entries: CalendarEntry[] = [];
    const start = new Date(range.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);

    let index = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
        const point = activityData[index];
        const calls = point?.calls ?? 0;
        const chats = point?.chats ?? 0;
        const selections = point?.selections ?? 0;
        const total = calls + chats + selections;

        entries.push({
            key: cursor.toISOString().slice(0, 10),
            labelShort: cursor.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
            labelLong: cursor.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }),
            dateNumber: cursor.getDate(),
            total,
            calls,
            chats,
            selections,
        });

        cursor.setDate(cursor.getDate() + 1);
        index += 1;
    }

    return entries;
}

export function PersonalAnalyticsInsights({
    dynamicKpi,
    activityData,
    funnels,
    period,
    range,
    allowPlanEditing = true,
}: PersonalAnalyticsInsightsProps) {
    const salesFunnel = funnels.find((funnel) => funnel.id === "sales") ?? funnels[0];
    const defaultPlanTargets = useMemo(() => buildDefaultPlanTargets(dynamicKpi), [dynamicKpi]);
    const [planTargets, setPlanTargets] = useState<PlanTargetsByBucket>(defaultPlanTargets);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [editBucket, setEditBucket] = useState<PlanBucket>("week");
    const [draftPlanTargets, setDraftPlanTargets] = useState<PlanTargetsByBucket>(defaultPlanTargets);
    const [isActivityDrilldownOpen, setIsActivityDrilldownOpen] = useState(false);

    useEffect(() => {
        setPlanTargets((prev) => mergePlanTargets(defaultPlanTargets, prev));
        setDraftPlanTargets((prev) => mergePlanTargets(defaultPlanTargets, prev));
    }, [defaultPlanTargets]);

    useEffect(() => {
        if (!allowPlanEditing) {
            setPlanTargets(defaultPlanTargets);
            setDraftPlanTargets(defaultPlanTargets);
            return;
        }

        try {
            const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Partial<Record<PlanBucket, Partial<Record<PlanMetricKey, number>>>>;
            const merged = mergePlanTargets(defaultPlanTargets, parsed);
            setPlanTargets(merged);
            setDraftPlanTargets(merged);
        } catch {
            // ignore localStorage parse issues
        }
    }, [allowPlanEditing, defaultPlanTargets]);

    const activePlanBucket: PlanBucket = period === "month" || period === "allTime" ? "month" : "week";
    const activePlan = planTargets[activePlanBucket];
    const factMetrics: PlanMetrics = useMemo(
        () => ({
            leads: dynamicKpi.addedLeads,
            contacts: dynamicKpi.callClicks + dynamicKpi.chatOpens + dynamicKpi.selectionsCreated,
            deals: dynamicKpi.deals,
        }),
        [dynamicKpi]
    );

    const planRows = (Object.keys(metricLabels) as PlanMetricKey[]).map((key) => {
        const plan = activePlan[key];
        const fact = factMetrics[key];
        const percent = plan > 0 ? Math.round((fact / plan) * 100) : 0;
        return {
            key,
            label: metricLabels[key],
            plan,
            fact,
            percent,
        };
    });
    const overallProgressPercent = planRows.length
        ? Math.round(planRows.reduce((sum, row) => sum + row.percent, 0) / planRows.length)
        : 0;
    const calendarEntries = useMemo(
        () => buildCalendarEntries(period, range, activityData),
        [period, range, activityData]
    );
    const dayOffset = useMemo(() => {
        if (period === "allTime") return 0;
        return getDayIndexFromMonday(range.start);
    }, [period, range]);

    const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
    useEffect(() => {
        setSelectedEntryKey(calendarEntries[0]?.key ?? null);
    }, [calendarEntries]);

    const selectedEntry =
        calendarEntries.find((entry) => entry.key === selectedEntryKey) ?? calendarEntries[0] ?? null;
    const openActivityDrilldown = (entryKey: string) => {
        setSelectedEntryKey(entryKey);
        setIsActivityDrilldownOpen(true);
    };

    const calendarCaption = useMemo(() => {
        if (period === "allTime") return "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 12 \u043c\u0435\u0441\u044f\u0446\u0435\u0432";
        if (period === "week") {
            const start = range.start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
            const end = range.end.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
            return `${start} - ${end}`;
        }
        return range.start.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    }, [period, range]);

    const weekDayLabels = ["\u041f\u043d", "\u0412\u0442", "\u0421\u0440", "\u0427\u0442", "\u041f\u0442", "\u0421\u0431", "\u0412\u0441"];

    const stageRows = (salesFunnel?.columns ?? [])
        .flatMap((column) =>
            column.stages.map((stage) => ({
                id: stage.id,
                name: stage.name,
                count: stage.count,
                columnId: column.id,
            }))
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    const stageMax = Math.max(...stageRows.map((row) => row.count), 1);

    const columnSegments = salesFunnel?.columns ?? [];
    const totalCount = salesFunnel?.totalCount ?? 0;
    const columnRows = columnSegments
        .map((segment) => ({
            id: segment.id,
            name: segment.name,
            count: segment.count,
            share: totalCount > 0 ? Math.round((segment.count / totalCount) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    const averageColumnLoad = columnRows.length > 0 ? Math.round(totalCount / columnRows.length) : 0;

    return (
        <div className="grid items-start gap-4 xl:grid-cols-2">
            <Card className="xl:col-span-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-sm">{"\u041f\u043b\u0430\u043d/\u0444\u0430\u043a\u0442"}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {activePlanBucket === "week"
                                    ? "\u041f\u043b\u0430\u043d \u043d\u0430 \u043d\u0435\u0434\u0435\u043b\u044e"
                                    : "\u041f\u043b\u0430\u043d \u043d\u0430 \u043c\u0435\u0441\u044f\u0446"}
                            </p>
                        </div>
                        {allowPlanEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDraftPlanTargets(planTargets);
                                    setEditBucket(activePlanBucket);
                                    setIsPlanDialogOpen(true);
                                }}
                            >
                                {"\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u043f\u043b\u0430\u043d"}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                    {planRows.map((row) => {
                        const progressWidth = Math.min(Math.max(row.percent, 0), 140);
                        return (
                            <div key={row.key} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-muted-foreground">{row.label}</span>
                                    <span className="font-medium">
                                        {row.fact.toLocaleString("ru-RU")} / {row.plan.toLocaleString("ru-RU")}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", getProgressTone(row.percent))}
                                        style={{ width: `${progressWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">{"\u041e\u0431\u0449\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441"}</span>
                        <span className="font-semibold">{overallProgressPercent}%</span>
                    </div>
                </CardContent>
            </Card>

            {allowPlanEditing && (
                <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{"\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u043f\u043b\u0430\u043d"}</DialogTitle>
                            <DialogDescription>
                                {"\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0446\u0435\u043b\u0438 \u0434\u043b\u044f \u043d\u0435\u0434\u0435\u043b\u0438 \u0438 \u043c\u0435\u0441\u044f\u0446\u0430."}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={editBucket} onValueChange={(v) => setEditBucket(v as PlanBucket)}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="week">{"\u041d\u0435\u0434\u0435\u043b\u044f"}</TabsTrigger>
                                <TabsTrigger value="month">{"\u041c\u0435\u0441\u044f\u0446"}</TabsTrigger>
                            </TabsList>
                            {(["week", "month"] as PlanBucket[]).map((bucket) => (
                                <TabsContent key={bucket} value={bucket} className="space-y-3 pt-3">
                                    {(Object.keys(metricLabels) as PlanMetricKey[]).map((key) => (
                                        <div key={`${bucket}-${key}`} className="space-y-1.5">
                                            <Label htmlFor={`${bucket}-${key}`}>{metricLabels[key]}</Label>
                                            <Input
                                                id={`${bucket}-${key}`}
                                                type="number"
                                                min={0}
                                                value={draftPlanTargets[bucket][key]}
                                                onChange={(e) => {
                                                    const next = Number(e.target.value);
                                                    setDraftPlanTargets((prev) => ({
                                                        ...prev,
                                                        [bucket]: {
                                                            ...prev[bucket],
                                                            [key]: normalizePlanValue(next),
                                                        },
                                                    }));
                                                }}
                                            />
                                        </div>
                                    ))}
                                </TabsContent>
                            ))}
                        </Tabs>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                                {"\u041e\u0442\u043c\u0435\u043d\u0430"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setPlanTargets(draftPlanTargets);
                                    try {
                                        window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(draftPlanTargets));
                                    } catch {
                                        // ignore localStorage write issues
                                    }
                                    setIsPlanDialogOpen(false);
                                }}
                            >
                                {"\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-sm">{"\u041a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u044c \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438"}</CardTitle>
                        <span className="text-[11px] text-muted-foreground">{calendarCaption}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                    {period !== "allTime" ? (
                        <div className="grid grid-cols-7 gap-1.5">
                            {weekDayLabels.map((dayLabel) => (
                                <div key={dayLabel} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
                                    {dayLabel}
                                </div>
                            ))}

                            {Array.from({ length: dayOffset }).map((_, index) => (
                                <div key={`empty-${index}`} className="h-16 rounded-md border border-dashed border-border/40" />
                            ))}

                            {calendarEntries.map((entry) => {
                                const tone = getTrafficTone(entry.total);
                                const isActive = selectedEntry?.key === entry.key;
                                return (
                                    <button
                                        key={entry.key}
                                        type="button"
                                        onClick={() => openActivityDrilldown(entry.key)}
                                        className={cn(
                                            "h-16 rounded-md border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            tone.className,
                                            isActive && "ring-2 ring-primary/70"
                                        )}
                                        title={`${entry.labelLong}: ${entry.total.toLocaleString("ru-RU")} \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold leading-none">{entry.dateNumber}</span>
                                            <span className="text-[10px] font-semibold">{entry.total}</span>
                                        </div>
                                        <p className="mt-1 truncate text-[10px]">{tone.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                            {calendarEntries.map((entry) => {
                                const tone = getTrafficTone(entry.total);
                                const isActive = selectedEntry?.key === entry.key;
                                return (
                                    <button
                                        key={entry.key}
                                        type="button"
                                        onClick={() => openActivityDrilldown(entry.key)}
                                        className={cn(
                                            "h-14 rounded-md border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            tone.className,
                                            isActive && "ring-2 ring-primary/70"
                                        )}
                                    >
                                        <p className="truncate text-xs font-medium">{entry.labelShort}</p>
                                        <p className="mt-1 text-xs font-semibold">{entry.total.toLocaleString("ru-RU")}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                {"0 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                {"1-4 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {"5+ \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439"}
                            </span>
                        </div>

                    {selectedEntry && (
                        <div className="rounded-lg border bg-muted/30 p-2.5">
                            <p className="text-xs font-medium">{selectedEntry.labelLong}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                <span>{"\u0412\u0441\u0435\u0433\u043e: "}{selectedEntry.total.toLocaleString("ru-RU")}</span>
                                <span>{"\u0417\u0432\u043e\u043d\u043a\u0438: "}{selectedEntry.calls.toLocaleString("ru-RU")}</span>
                                <span>{"\u0427\u0430\u0442\u044b: "}{selectedEntry.chats.toLocaleString("ru-RU")}</span>
                                <span>{"\u041f\u043e\u0434\u0431\u043e\u0440\u043a\u0438: "}{selectedEntry.selections.toLocaleString("ru-RU")}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isActivityDrilldownOpen} onOpenChange={setIsActivityDrilldownOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEntry
                                ? `\u0421\u043e\u0441\u0442\u0430\u0432 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439: ${selectedEntry.labelLong}`
                                : "\u0421\u043e\u0441\u0442\u0430\u0432 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEntry
                                ? `\u0412\u0441\u0435\u0433\u043e \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439: ${selectedEntry.total.toLocaleString("ru-RU")}`
                                : "\u0412\u044b\u0431\u0435\u0440\u0438 \u0434\u0435\u043d\u044c \u0438\u043b\u0438 \u043c\u0435\u0441\u044f\u0446 \u0432 \u043a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u0435."}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEntry ? (
                        <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Звонки</p>
                                <p className="text-lg font-semibold">{selectedEntry.calls.toLocaleString("ru-RU")}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntry.total > 0
                                        ? `${Math.round((selectedEntry.calls / selectedEntry.total) * 100)}% \u043e\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439`
                                        : "\u2014"}
                                </p>
                            </div>
                            <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Подборки</p>
                                <p className="text-lg font-semibold">{selectedEntry.selections.toLocaleString("ru-RU")}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntry.total > 0
                                        ? `${Math.round((selectedEntry.selections / selectedEntry.total) * 100)}% \u043e\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439`
                                        : "\u2014"}
                                </p>
                            </div>
                            <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Чаты</p>
                                <p className="text-lg font-semibold">{selectedEntry.chats.toLocaleString("ru-RU")}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntry.total > 0
                                        ? `${Math.round((selectedEntry.chats / selectedEntry.total) * 100)}% \u043e\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0435\u0439`
                                        : "\u2014"}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{"\u0421\u0442\u0430\u0442\u0443\u0441\u044b \u043b\u0438\u0434\u043e\u0432 \u0432 \u0440\u0430\u0431\u043e\u0442\u0435"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                    {totalCount > 0 && (
                        <div className="space-y-2">
                            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                                {columnSegments.map((segment) => {
                                    const width = Math.max(3, (segment.count / totalCount) * 100);
                                    return (
                                        <div
                                            key={segment.id}
                                            className={cn(statusToneByColumn[segment.id] ?? "bg-primary")}
                                            style={{ width: `${width}%` }}
                                            title={`${segment.name}: ${segment.count.toLocaleString("ru-RU")}`}
                                        />
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {"\u0412\u0441\u0435\u0433\u043e \u043b\u0438\u0434\u043e\u0432 \u0432 \u0432\u043e\u0440\u043e\u043d\u043a\u0435: "}
                                {totalCount.toLocaleString("ru-RU")}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {stageRows.map((row) => {
                            const width = Math.max(8, (row.count / stageMax) * 100);
                            return (
                                <div key={row.id} className="space-y-1">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="truncate text-muted-foreground">{row.name}</span>
                                        <span className="font-medium">{row.count.toLocaleString("ru-RU")}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted">
                                        <div
                                            className={cn(
                                                "h-full rounded-full",
                                                statusToneByColumn[row.columnId] ?? "bg-primary"
                                            )}
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {columnRows.length > 0 && (
                        <div className="space-y-2 rounded-lg border bg-muted/25 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {"\u041a\u043e\u043b\u043e\u043d\u043e\u043a \u0432 \u0432\u043e\u0440\u043e\u043d\u043a\u0435"}
                                    </p>
                                    <p className="text-base font-semibold">{columnRows.length}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {"\u0421\u0440\u0435\u0434\u043d\u044f\u044f \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043d\u0430 \u043a\u043e\u043b\u043e\u043d\u043a\u0443"}
                                    </p>
                                    <p className="text-base font-semibold">{averageColumnLoad.toLocaleString("ru-RU")}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                {columnRows.map((row) => (
                                    <div key={row.id} className="flex items-center justify-between gap-2 text-xs">
                                        <span className="truncate text-muted-foreground">{row.name}</span>
                                        <span className="font-medium">
                                            {row.count.toLocaleString("ru-RU")} ({row.share}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
