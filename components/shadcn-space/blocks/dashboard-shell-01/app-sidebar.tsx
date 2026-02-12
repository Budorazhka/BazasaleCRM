"use client";
import React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo/logo";
import { NavMain } from "@/components/shadcn-space/blocks/dashboard-shell-01/nav-main";
import {
    AlignStartVertical,
    BarChart3,
    CircleUserRound,
    ClipboardList,
    Languages,
    LucideIcon,
    Notebook,
    NotepadText,
    Table,
    Ticket,
} from "lucide-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import "simplebar-react/dist/simplebar.min.css";

export type NavItem = {
    label?: string;
    isSection?: boolean;
    title?: string;
    icon?: LucideIcon;
    href?: string;
    children?: NavItem[];
};

export const navData: NavItem[] = [
    // Dashboards Section
    { label: "Дашборды", isSection: true },
    { title: "Аналитика сети", icon: BarChart3, href: "/analytics" },
    { title: "Аналитика меня", icon: ClipboardList, href: "/analytics/me" },

    // Pages Section
    { label: "Страницы", isSection: true },
    { title: "Таблицы", icon: Table, href: "#" },
    { title: "Формы", icon: ClipboardList, href: "#" },
    { title: "Профиль", icon: CircleUserRound, href: "#" },

    // Apps Section
    { label: "Приложения", isSection: true },
    { title: "Заметки", icon: Notebook, href: "#" },
    { title: "Тикеты", icon: Ticket, href: "#" },
    {
        title: "Блог",
        icon: Languages,
        children: [
            { title: "Пост", href: "#" },
            { title: "Детали поста", href: "#" },
            { title: "Редактировать", href: "#" },
            { title: "Создать", href: "#" },
            { title: "Управление", href: "#" },
        ],
    },

    // Form Elements Section
    { label: "Элементы форм", isSection: true },
    {
        title: "Shadcn Формы",
        icon: NotepadText,
        children: [
            { title: "Кнопка", href: "#" },
            { title: "Поле ввода", href: "#" },
            { title: "Выбор", href: "#" },
            { title: "Чекбокс", href: "#" },
            { title: "Радио", href: "#" },
        ],
    },
    {
        title: "Макеты форм",
        icon: AlignStartVertical,
        children: [
            { title: "Горизонтальная", href: "#" },
            { title: "Вертикальная", href: "#" },
            { title: "Валидация", href: "#" },
            { title: "Примеры", href: "#" },
            { title: "Мастер форм", href: "#" },
        ],
    },
];

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <Sidebar className="py-4 px-0 bg-background" variant="inset" side="left">
                <div className="flex flex-col h-full bg-background">
                    {/* ---------------- Header ---------------- */}
                    <SidebarHeader className="py-0 px-4">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <a href="#" className="w-full h-full">
                                    <Logo />
                                </a>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    {/* ---------------- Content ---------------- */}
                    <SidebarContent className="overflow-hidden gap-0 px-0">
                        <SimpleBar autoHide={true} className="h-full border-b border-border">
                            <div className="px-4">
                                <NavMain items={navData} />
                            </div>
                        </SimpleBar>
                        {/* card */}
                        <div className="pt-4 px-4 pb-4">
                            <Card className="shadow-none ring-0 bg-blue-500/10 px-4 py-6">
                                <CardContent className="p-0 flex flex-col gap-3 items-center">
                                    <img
                                        src="https://images.shadcnspace.com/assets/backgrounds/download-img.png"
                                        alt="Промо-блок"
                                        width={74}
                                        height={74}
                                        className="h-20 w-20"
                                    />
                                    <div className="flex flex-col gap-4 items-center">
                                        <div>
                                            <p className="text-base font-semibold text-card-foreground text-center">
                                                Получить Pro
                                            </p>
                                            <p className="text-sm font-regular text-muted-foreground text-center">
                                                Настройте админ-панель под себя
                                            </p>
                                        </div>
                                        <Button className="w-fit px-4 py-2 shadow-none cursor-pointer rounded-xl bg-blue-500 font-medium hover:bg-blue-500/80">
                                            Купить
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </SidebarContent>


                </div>
            </Sidebar>

            {/* ---------------- Main ---------------- */}
            <SidebarInset>
                <main className="flex-1 flex flex-col h-full w-full">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppSidebar;
