// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: вход в карточку конкретного партнёра; тут ты берешь id из URL и передаешь в страницу аналитики.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { PersonAnalyticsPage } from "@/components/analytics-network/person-analytics-page";
import { getAllPartnerIds } from "@/lib/mock/analytics-network";

interface PartnerPageProps {
    params: { id: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllPartnerIds().map((id) => ({ id }));
}

export default function Page({ params }: PartnerPageProps) {
    return <PersonAnalyticsPage personId={params.id} mode="partner" />;
}
