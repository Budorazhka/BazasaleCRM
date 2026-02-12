"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: круговая/составная аналитика активности; ты показываешь доли звонков, чатов и подборок.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import type { DynamicKpi } from "@/types/analytics";

interface ActivityCompositionProps {
    data: DynamicKpi;
}

const chartConfig = {
    calls: {
        label: "Звонки",
        color: "hsl(25, 95%, 53%)",
    },
    chats: {
        label: "Чаты",
        color: "hsl(187, 85%, 53%)",
    },
    selections: {
        label: "Подборки",
        color: "hsl(330, 81%, 60%)",
    },
} satisfies ChartConfig;

export function ActivityComposition({ data }: ActivityCompositionProps) {
    const items = [
        { key: "calls", label: "Звонки", value: data.callClicks, color: "var(--color-calls)" },
        { key: "chats", label: "Чаты", value: data.chatOpens, color: "var(--color-chats)" },
        { key: "selections", label: "Подборки", value: data.selectionsCreated, color: "var(--color-selections)" },
    ];

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card>
            <CardHeader className="px-4 pb-1 pt-3">
                <CardTitle className="text-sm font-medium">Состав активности</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-2 sm:flex-row sm:items-center">
                <ChartContainer config={chartConfig} className="mx-auto h-[140px] w-[140px] shrink-0 aspect-auto sm:mx-0">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                            data={items}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={42}
                            outerRadius={62}
                            strokeWidth={0}
                        >
                            {items.map((item) => (
                                <Cell key={item.key} fill={item.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="w-full space-y-2">
                    {items.map((item) => {
                        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                            <div key={item.key} className="flex items-center gap-2 text-xs">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="ml-auto font-medium">{percent}%</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
