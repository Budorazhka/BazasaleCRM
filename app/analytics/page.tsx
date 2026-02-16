"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: главная страница аналитики сети; тут ты управляешь фильтрами, сортировкой и сборкой данных на экран.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ActivityCalendarCard,
    ActivityChart,
    ActivityComposition,
    ConversionOverviewChart,
    DynamicKpiCards,
    FunnelKanban,
    LeaderboardTable,
    LeadsChart,
    PartnersActivityDistribution,
    PeriodTabs,
    StaticKpiCards,
    TopReferralsChart,
} from "@/components/analytics-network";
import { AnalyticsNavLinks } from "@/components/app-header";
import { ParticipantCell } from "@/components/analytics-network/participant-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAnalyticsData, getPeriodDateRange } from "@/lib/mock/analytics-network";
import type { ActivityMarker, AnalyticsPeriod, SortColumn, SortDirection } from "@/types/analytics";
import { ArrowLeft, ArrowRight, Home, Users } from "lucide-react";

const defaultPeriod: AnalyticsPeriod = "week";
const defaultSortColumn: SortColumn = "leadsAdded";
const defaultSortDirection: SortDirection = "desc";

export default function Page() {
    const router = useRouter();
    const leftColumnRef = useRef<HTMLDivElement | null>(null);
    const [globalPeriod, setGlobalPeriod] = useState<AnalyticsPeriod>(defaultPeriod);
    const [leadsPeriod, setLeadsPeriod] = useState<AnalyticsPeriod>("week");
    const [activityPeriod, setActivityPeriod] = useState<AnalyticsPeriod>("week");
    const [topReferralsPeriod, setTopReferralsPeriod] = useState<AnalyticsPeriod>("week");
    const [engagementPeriod, setEngagementPeriod] = useState<AnalyticsPeriod>("week");
    const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);
    const [isDesktopLayout, setIsDesktopLayout] = useState(false);

    const [sortColumn, setSortColumn] = useState<SortColumn>(defaultSortColumn);
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
    const [searchQuery, setSearchQuery] = useState("");
    const [onlyOnline, setOnlyOnline] = useState(false);
    const [inactiveLast7, setInactiveLast7] = useState(false);
    const [selectedActivityMarker, setSelectedActivityMarker] = useState<ActivityMarker | null>(null);

    const globalAnalytics = useMemo(() => getAnalyticsData(globalPeriod), [globalPeriod]);
    const todayAnalytics = useMemo(() => getAnalyticsData("week"), []);
    const leadsData = useMemo(() => getAnalyticsData(leadsPeriod).leadsTimeseries, [leadsPeriod]);
    const activityData = useMemo(() => getAnalyticsData(activityPeriod).activityTimeseries, [activityPeriod]);
    const monthCalendarData = useMemo(() => getAnalyticsData("month").activityTimeseries, []);
    const allTimeCalendarData = useMemo(() => getAnalyticsData("allTime").activityTimeseries, []);
    const topReferralsPartners = useMemo(
        () => getAnalyticsData(topReferralsPeriod).partners,
        [topReferralsPeriod]
    );
    const engagementPartners = useMemo(
        () => getAnalyticsData(engagementPeriod).partners,
        [engagementPeriod]
    );

    const selectedActivityPartners = useMemo(
        () =>
            selectedActivityMarker
                ? engagementPartners.filter((p) => p.activityMarker === selectedActivityMarker)
                : [],
        [engagementPartners, selectedActivityMarker]
    );
    const level2ReferralsTotal = useMemo(
        () => globalAnalytics.partners.reduce((sum, partner) => sum + partner.level2Count, 0),
        [globalAnalytics.partners]
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

    const filteredPartners = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        let partners = globalAnalytics.partners;

        if (query) {
            partners = partners.filter((partner) => partner.name.toLowerCase().includes(query));
        }
        if (onlyOnline) {
            partners = partners.filter((partner) => partner.isOnline);
        }
        if (inactiveLast7) {
            partners = partners.filter((partner) => partner.onlineDaysLast7 === 0);
        }

        return partners;
    }, [globalAnalytics.partners, searchQuery, onlyOnline, inactiveLast7]);

    const maxLeadsAdded = useMemo(
        () => Math.max(...filteredPartners.map((partner) => partner.leadsAdded), 1),
        [filteredPartners]
    );
    const maxStageChangesCount = useMemo(
        () => Math.max(...filteredPartners.map((partner) => partner.stageChangesCount), 1),
        [filteredPartners]
    );

    const sortedPartners = useMemo(() => {
        return [...filteredPartners].sort((a, b) => {
            const diff = a[sortColumn] - b[sortColumn];
            if (diff !== 0) {
                return sortDirection === "asc" ? diff : -diff;
            }
            return a.name.localeCompare(b.name, "ru", { sensitivity: "base" });
        });
    }, [filteredPartners, sortColumn, sortDirection]);

    const partnersFunnel = useMemo(
        () => globalAnalytics.funnels.find((funnel) => funnel.id === "broker"),
        [globalAnalytics.funnels]
    );
    const salesFunnel = useMemo(
        () => globalAnalytics.funnels.find((funnel) => funnel.id === "sales") ?? globalAnalytics.funnels[0],
        [globalAnalytics.funnels]
    );
    const partnersCount = partnersFunnel?.totalCount ?? 0;
    const handleSortChange = (column: SortColumn) => {
        if (column === sortColumn) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortColumn(column);
        setSortDirection("desc");
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setOnlyOnline(false);
        setInactiveLast7(false);
        setSortColumn(defaultSortColumn);
        setSortDirection(defaultSortDirection);
    };

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        const syncBreakpoint = () => setIsDesktopLayout(mediaQuery.matches);

        syncBreakpoint();
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", syncBreakpoint);
            return () => mediaQuery.removeEventListener("change", syncBreakpoint);
        }

        mediaQuery.addListener(syncBreakpoint);
        return () => mediaQuery.removeListener(syncBreakpoint);
    }, []);

    useEffect(() => {
        if (!isDesktopLayout) {
            setLeftColumnHeight(null);
            return;
        }

        const leftColumnNode = leftColumnRef.current;
        if (!leftColumnNode) return;

        const syncHeight = () => {
            setLeftColumnHeight(Math.round(leftColumnNode.getBoundingClientRect().height));
        };

        syncHeight();

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => syncHeight())
                : null;

        observer?.observe(leftColumnNode);
        window.addEventListener("resize", syncHeight);

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", syncHeight);
        };
    }, [isDesktopLayout]);

    return (
        <div className="w-full space-y-4 overflow-x-hidden px-3 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{rangeLabel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-medium">Аналитика сети</h1>
                        <Badge variant="outline" className="text-xs">
                            {globalAnalytics.periodLabel}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-1 justify-center">
                    <AnalyticsNavLinks />
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Button
                        asChild
                        size="sm"
                        className="border border-emerald-500/35 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 dark:text-emerald-300"
                    >
                        <Link href="/analytics" className="inline-flex items-center gap-1.5">
                            <ArrowLeft className="size-4" />
                            Вернуться в CRM
                        </Link>
                    </Button>
                    <PeriodTabs selectedPeriod={globalPeriod} onPeriodChange={setGlobalPeriod} />
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-stretch">
                <div ref={leftColumnRef} className="space-y-4 lg:sticky lg:top-24 self-start">
                    <StaticKpiCards
                        data={globalAnalytics.staticKpi}
                        secondMetric={{ label: "Рефералы L2", value: level2ReferralsTotal }}
                    />
                    <DynamicKpiCards
                        data={globalAnalytics.dynamicKpi}
                        todayData={todayAnalytics.dynamicKpi}
                        periodLabel={globalAnalytics.periodLabel}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Card className="p-3">
                            <CardContent className="p-0 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-teal-400/10 text-teal-600 dark:text-teal-400 shadow-none text-[10px]">
                                        +{todayAnalytics.dynamicKpi.addedListings.toLocaleString("ru-RU")} за сегодня
                                    </Badge>
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <Home className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium">
                                        {globalAnalytics.staticKpi.totalListings.toLocaleString("ru-RU")}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">Количество объектов</p>
                                    <p className="text-[10px] text-muted-foreground/80">
                                        за {globalAnalytics.periodLabel.toLocaleLowerCase("ru-RU")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="p-3">
                            <CardContent className="p-0 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-teal-400/10 text-teal-600 dark:text-teal-400 shadow-none text-[10px]">
                                        +{todayAnalytics.dynamicKpi.addedLevel1Referrals.toLocaleString("ru-RU")} за сегодня
                                    </Badge>
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Users className="h-4 w-4 text-blue-500" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium">{partnersCount.toLocaleString("ru-RU")}</p>
                                    <p className="text-[11px] text-muted-foreground">Количество партнёров</p>
                                    <p className="text-[10px] text-muted-foreground/80">
                                        за {globalAnalytics.periodLabel.toLocaleLowerCase("ru-RU")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div
                    className="flex min-h-0 flex-col gap-4"
                    style={
                        isDesktopLayout && leftColumnHeight
                            ? { height: `${leftColumnHeight}px` }
                            : undefined
                    }
                >
                    <div className="flex flex-col gap-3 rounded-lg border bg-card px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-4">
                        <div className="min-w-0 flex-1">
                            <Input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Поиск партнёра"
                                className="h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="only-online" checked={onlyOnline} onCheckedChange={setOnlyOnline} />
                            <Label htmlFor="only-online" className="text-xs font-normal">
                                Только онлайн
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="inactive-last7" checked={inactiveLast7} onCheckedChange={setInactiveLast7} />
                            <Label htmlFor="inactive-last7" className="text-xs font-normal">
                                Не активные 7 дней
                            </Label>
                        </div>
                    </div>

                    <LeaderboardTable
                        partners={sortedPartners}
                        maxLeadsAdded={maxLeadsAdded}
                        maxStageChangesCount={maxStageChangesCount}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSortChange={handleSortChange}
                        onResetFilters={handleResetFilters}
                        className="lg:min-h-0 lg:flex-1"
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <LeadsChart data={leadsData} period={leadsPeriod} onPeriodChange={setLeadsPeriod} />
                <ActivityChart data={activityData} period={activityPeriod} onPeriodChange={setActivityPeriod} />
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-12">
                <ActivityCalendarCard
                    period={globalPeriod}
                    range={range}
                    monthRange={monthRangeForCalendar}
                    monthData={monthCalendarData}
                    allTimeData={allTimeCalendarData}
                    className="xl:col-span-6 h-full"
                />
                <ActivityComposition data={globalAnalytics.dynamicKpi} className="xl:col-span-3 h-full" />
                <ConversionOverviewChart funnel={salesFunnel} className="xl:col-span-3 h-full" />
            </div>

            <div className="space-y-3">
                <div className="text-center">
                    <p className="text-sm font-medium">Активность партнёров</p>
                    <p className="text-xs text-muted-foreground">
                        Топ по лидам и распределение по активности за выбранный период.
                    </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <TopReferralsChart
                        partners={topReferralsPartners}
                        period={topReferralsPeriod}
                        onPeriodChange={setTopReferralsPeriod}
                    />
                    <PartnersActivityDistribution
                        partners={engagementPartners}
                        period={engagementPeriod}
                        onPeriodChange={setEngagementPeriod}
                        onSegmentClick={(marker) => setSelectedActivityMarker(marker)}
                    />
                </div>
            </div>

            <FunnelKanban funnels={globalAnalytics.funnels} />

            {selectedActivityMarker !== null && (
                <Dialog
                    open={true}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedActivityMarker(null);
                    }}
                >
                    <DialogContent className="max-w-lg sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedActivityMarker === "green"
                                    ? "Активные партнёры"
                                    : selectedActivityMarker === "yellow"
                                    ? "Средние партнёры"
                                    : "Пассивные партнёры"}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedActivityPartners.length}{" "}
                                {selectedActivityPartners.length === 1 ? "партнёр" : "партнёров"} в этой группе.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-2 space-y-3 max-h-[400px] overflow-y-auto">
                            {selectedActivityPartners.map((partner) => (
                                <div key={partner.id} className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:p-1">
                                    <div className="min-w-0 flex-1">
                                        <ParticipantCell partner={partner} />
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="w-full shrink-0 sm:w-auto"
                                        onClick={() => router.push(`/analytics/partners/${partner.id}`)}
                                    >
                                        Карточка
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}


