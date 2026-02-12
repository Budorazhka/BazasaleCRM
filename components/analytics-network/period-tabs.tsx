"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: переключатель периодов; если ты добавишь новый период, обнови типы и расчёт диапазонов.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyticsPeriod } from "@/types/analytics";

interface PeriodTabsProps {
    selectedPeriod: AnalyticsPeriod;
    onPeriodChange: (period: AnalyticsPeriod) => void;
}

const periods: { value: AnalyticsPeriod; label: string }[] = [
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "allTime", label: "За всё время" },
];

export function PeriodTabs({ selectedPeriod, onPeriodChange }: PeriodTabsProps) {
    return (
        <Tabs
            value={selectedPeriod}
            onValueChange={(value) => onPeriodChange(value as AnalyticsPeriod)}
        >
            <TabsList className="h-auto flex-wrap justify-start">
                {periods.map((period) => (
                    <TabsTrigger key={period.value} value={period.value} className="text-xs sm:text-sm">
                        {period.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
