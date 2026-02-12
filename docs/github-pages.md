# GitHub Pages: как выложить проект как презентацию

## Что уже настроено
- в `next.config.mjs` включен статический экспорт (`output: "export"`);
- добавлен workflow автодеплоя: `.github/workflows/deploy-pages.yml`;
- для страницы партнёров добавлена генерация статических маршрутов.

То есть после пуша в `main` сайт будет деплоиться автоматически.

## Что тебе нужно сделать в репозитории
1. Открой `Settings -> Pages`.
2. В `Build and deployment` выбери `Source: GitHub Actions`.
3. Убедись, что основной branch для деплоя у тебя `main`.
4. Сделай push изменений в `main`.

## Где будет ссылка
- Если это project pages: `https://<username>.github.io/<repo>/`
- Если это user/org pages (`<repo>.github.io`): `https://<repo>.github.io/`

## Важные нюансы
- Первый деплой может занять пару минут.
- Если меняешь имя репозитория, URL тоже поменяется.
- Для превью прямо перед показом можно вручную запустить workflow через `Actions -> Deploy Next.js to GitHub Pages -> Run workflow`.
