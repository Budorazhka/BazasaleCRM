"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи стабильную геометрию календаря: для недели и месяца сетка одинаковая.
// Смысл файла: календарь активности для главной аналитики с drilldown по составу (звонки/чаты/рассылки).
// После правок ты проверяешь экран руками и сверяешь выделение недели и цифры в модалке.

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ActivityTimeseriesPoint, AnalyticsPeriod } from "@/types/analytics";

type CalendarEntry = {
    key: string;
    labelShort: string;
    labelLong: string;
    dateNumber?: number;
    total: number;
    calls: number;
    chats: number;
    selections: number;
    inSelectedRange?: boolean;
    isFuture?: boolean;
};

interface ActivityCalendarCardProps {
    period: AnalyticsPeriod;
    range: { start: Date; end: Date };
    monthRange: { start: Date; end: Date };
    monthData: ActivityTimeseriesPoint[];
    allTimeData: ActivityTimeseriesPoint[];
    className?: string;
    highContrast?: boolean;
}

function getDayIndexFromMonday(date: Date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

function getTrafficTone(total: number) {
    if (total === 0) {
        return {
            label: "Нет действий",
            className:
                "bg-rose-100/80 border-rose-300 text-rose-900 hover:bg-rose-100 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-200",
        };
    }

    if (total < 5) {
        return {
            label: "Низкая активность",
            className:
                "bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-100 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-200",
        };
    }

    return {
        label: "Активный день",
        className:
            "bg-emerald-100/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-200",
    };
}

function normalizeDate(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildMonthEntries(
    range: { start: Date; end: Date },
    monthData: ActivityTimeseriesPoint[],
    selectedRange: { start: Date; end: Date } | null
) {
    const monthStart = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    const monthEnd = new Date(range.start.getFullYear(), range.start.getMonth() + 1, 0);
    const selectedStart = selectedRange ? normalizeDate(selectedRange.start) : null;
    const selectedEnd = selectedRange ? normalizeDate(selectedRange.end) : null;

    const today = normalizeDate(new Date());
    const entries: CalendarEntry[] = [];
    let dayIndex = 0;
    const cursor = new Date(monthStart);
    while (cursor <= monthEnd) {
        const cursorDate = normalizeDate(cursor);
        const isFuture = cursorDate.getTime() > today.getTime();
        const point = monthData[dayIndex];
        const calls = isFuture ? 0 : point?.calls ?? 0;
        const chats = isFuture ? 0 : point?.chats ?? 0;
        const selections = isFuture ? 0 : point?.selections ?? 0;
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
            isFuture,
            inSelectedRange: Boolean(
                selectedStart &&
                    selectedEnd &&
                    cursorDate.getTime() >= selectedStart.getTime() &&
                    cursorDate.getTime() <= selectedEnd.getTime()
            ),
        });

        cursor.setDate(cursor.getDate() + 1);
        dayIndex += 1;
    }

    return entries;
}

function buildAllTimeEntries(allTimeData: ActivityTimeseriesPoint[]) {
    return allTimeData.slice(-12).map((point, index) => ({
        key: `month-${index}`,
        labelShort: point.date,
        labelLong: point.date,
        total: point.calls + point.chats + point.selections,
        calls: point.calls,
        chats: point.chats,
        selections: point.selections,
    }));
}

export function ActivityCalendarCard({
    period,
    range,
    monthRange,
    monthData,
    allTimeData,
    className,
    highContrast = false,
}: ActivityCalendarCardProps) {
    const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

    const monthEntries = useMemo(
        () => buildMonthEntries(monthRange, monthData, period === "week" ? range : null),
        [monthRange, monthData, period, range]
    );
    const allTimeEntries = useMemo(() => buildAllTimeEntries(allTimeData), [allTimeData]);
    const entries = period === "allTime" ? allTimeEntries : monthEntries;

    const monthStart = useMemo(
        () => new Date(monthRange.start.getFullYear(), monthRange.start.getMonth(), 1),
        [monthRange]
    );
    const dayOffset = useMemo(() => getDayIndexFromMonday(monthStart), [monthStart]);

    useEffect(() => {
        setSelectedEntryKey(entries[0]?.key ?? null);
    }, [entries]);

    const selectedEntry = entries.find((entry) => entry.key === selectedEntryKey) ?? entries[0] ?? null;
    const weekDayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    const caption = useMemo(() => {
        if (period === "allTime") return "Последние 12 месяцев";
        const monthLabel = monthStart.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
        if (period === "week") {
            const start = range.start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
            const end = range.end.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
            return `${monthLabel} · неделя ${start} - ${end}`;
        }
        return monthLabel;
    }, [period, monthStart, range]);

    const openDrilldown = (entryKey: string) => {
        const entry = monthEntries.find((item) => item.key === entryKey) ?? allTimeEntries.find((item) => item.key === entryKey);
        if (entry?.isFuture) return;
        setSelectedEntryKey(entryKey);
        setIsDrilldownOpen(true);
    };
    const weekStartKey = period === "week" ? normalizeDate(range.start).toISOString().slice(0, 10) : null;
    const weekEndKey = period === "week" ? normalizeDate(range.end).toISOString().slice(0, 10) : null;

    return (
        <Card className={cn(className)}>
            <CardHeader className="pb-2">
                <div className="flex flex-col items-center gap-1 text-center">
                    <CardTitle className={cn("text-center text-sm", highContrast && "text-base")}>Календарь активности</CardTitle>
                    <span className={cn("text-[11px] text-muted-foreground", highContrast && "text-xs text-foreground/80")}>{caption}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 px-2 pt-1 sm:px-6">
                {period !== "allTime" ? (
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {weekDayLabels.map((dayLabel) => (
                            <div key={dayLabel} className={cn("pb-0.5 text-center text-[10px] font-medium text-muted-foreground sm:pb-1 sm:text-[11px]", highContrast && "sm:text-xs sm:text-foreground/75")}>
                                {dayLabel}
                            </div>
                        ))}

                        {Array.from({ length: dayOffset }).map((_, index) => (
                            <div key={`empty-${index}`} className="h-10 rounded-md border border-dashed border-border/40 sm:h-14" />
                        ))}

                        {monthEntries.map((entry) => {
                            const tone = getTrafficTone(entry.total);
                            const isActive = selectedEntry?.key === entry.key;
                            const isWeekStart = weekStartKey === entry.key;
                            const isWeekEnd = weekEndKey === entry.key;

                            return (
                                <button
                                    key={entry.key}
                                    type="button"
                                    onClick={() => openDrilldown(entry.key)}
                                    className={cn(
                                        "h-10 rounded-md border px-1 py-0.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-14 sm:p-1.5",
                                        entry.isFuture
                                            ? "bg-muted/20 border-border/60 text-muted-foreground hover:bg-muted/30"
                                            : tone.className,
                                        entry.inSelectedRange &&
                                            "border-primary ring-2 ring-primary/45 shadow-[0_0_0_1px_rgba(59,130,246,0.28)_inset]",
                                        isWeekStart && "ring-primary",
                                        isWeekEnd && "ring-primary",
                                        isActive && "ring-2 ring-primary",
                                        entry.isFuture && "cursor-not-allowed opacity-70"
                                    )}
                                    title={
                                        entry.isFuture
                                            ? `${entry.labelLong}: будущая дата (факт еще не наступил)`
                                            : `${entry.labelLong}: ${entry.total.toLocaleString("ru-RU")} активностей`
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn("text-xs font-medium leading-none sm:text-sm", highContrast && "sm:text-base sm:font-semibold")}>{entry.dateNumber}</span>
                                        <span className={cn("text-[9px] font-medium sm:text-[10px]", highContrast && "sm:text-xs sm:font-semibold")}>{entry.total}</span>
                                    </div>
                                    <p className={cn("mt-0.5 hidden truncate text-[10px] sm:block", highContrast && "sm:text-[11px] sm:font-medium")}>
                                        {entry.isFuture ? "Будущий день" : tone.label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                        {allTimeEntries.map((entry) => {
                            const tone = getTrafficTone(entry.total);
                            const isActive = selectedEntry?.key === entry.key;
                            return (
                                <button
                                    key={entry.key}
                                    type="button"
                                    onClick={() => openDrilldown(entry.key)}
                                    className={cn(
                                        "h-14 rounded-md border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        tone.className,
                                        isActive && "ring-2 ring-primary"
                                    )}
                                >
                                    <p className={cn("truncate text-xs font-medium", highContrast && "text-sm text-foreground/90")}>{entry.labelShort}</p>
                                    <p className={cn("mt-1 text-xs font-medium", highContrast && "text-sm font-semibold")}>{entry.total.toLocaleString("ru-RU")}</p>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]", highContrast && "sm:text-xs sm:text-foreground/75")}>
                    {period === "week" && (
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm border border-primary/70 bg-primary/20" />
                            Выделенная неделя
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        0 активностей
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        1-4 активности
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        5+ активностей
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                        Будущие дни
                    </span>
                </div>

                {selectedEntry && (
                    <div className="rounded-lg border bg-muted/30 p-2.5">
                        <p className={cn("text-xs font-medium", highContrast && "text-sm")}>{selectedEntry.labelLong}</p>
                        <div className={cn("mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground", highContrast && "text-xs text-foreground/75")}>
                            <span>Всего: {selectedEntry.total.toLocaleString("ru-RU")}</span>
                            <span>Звонки: {selectedEntry.calls.toLocaleString("ru-RU")}</span>
                            <span>Чаты: {selectedEntry.chats.toLocaleString("ru-RU")}</span>
                            <span>Рассылки: {selectedEntry.selections.toLocaleString("ru-RU")}</span>
                        </div>
                    </div>
                )}
            </CardContent>

            <Dialog open={isDrilldownOpen} onOpenChange={setIsDrilldownOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEntry
                                ? `Состав активностей: ${selectedEntry.labelLong}`
                                : "Состав активностей"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEntry
                                ? `Всего активностей: ${selectedEntry.total.toLocaleString("ru-RU")}`
                                : "Выбери день или месяц в календаре."}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEntry ? (
                        <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Звонки</p>
                                <p className="text-lg font-medium">{selectedEntry.calls.toLocaleString("ru-RU")}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntry.total > 0
                                        ? `${Math.round((selectedEntry.calls / selectedEntry.total) * 100)}% от активностей`
                                        : "—"}
                                </p>
                            </div>
                            <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Рассылки</p>
                                <p className="text-lg font-medium">
                                    {selectedEntry.selections.toLocaleString("ru-RU")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntry.total > 0
                                        ? `${Math.round((selectedEntry.selections / selectedEntry.total) * 100)}% от активностей`
                                        : "—"}
                                </p>
                            </div>
                            <div className="rounded-md border bg-muted/20 p-3">
                                <p className="text-xs text-muted-foreground">Чаты</p>
                                <p className="text-lg font-medium">{selectedEntry.chats.toLocaleString("ru-RU")}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntry.total > 0
                                        ? `${Math.round((selectedEntry.chats / selectedEntry.total) * 100)}% от активностей`
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

