// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: вход в режим "моя аналитика"; тут ты подставляешь id текущего пользователя.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { PersonAnalyticsPage } from "@/components/analytics-network/person-analytics-page";
import { getCurrentUserId } from "@/lib/mock/analytics-network";

export default function Page() {
    return <PersonAnalyticsPage personId={getCurrentUserId()} mode="me" />;
}
