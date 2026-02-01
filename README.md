# Insta carousel

Веб-приложение для сборки каруселей под Instagram. Загружаешь картинки, добавляешь текст на каждый слайд, настраиваешь шрифт и блок с текстом — экспортируешь в JPG. Форматы 1:1 и 4:5, до 10 слайдов.

Сделал для себя, чтобы не собирать слайды вручную в фигме каждый раз. Всё работает в браузере, ничего никуда не уходит.

## Запуск

```bash
npm install
npm run dev
```

Открываешь [http://localhost:3000](http://localhost:3000) — там интерфейс. Добавляешь изображения, выбираешь слайд, вводишь текст, при необходимости крутишь настройки стиля (шрифт, цвет, подложка, обводка, область текста). «Скачать текущий слайд» или «Скачать всю серию» — получаешь JPG.

## Стек

Next.js 15, React 19, TypeScript, Tailwind. Рендер текста на canvas, экспорт через `toDataURL('image/jpeg')`.

## Репозиторий

[https://github.com/shinigamiyo/insta-carousel-generator](https://github.com/shinigamiyo/insta-carousel-generator)


<img width="1697" height="1281" alt="image" src="https://github.com/user-attachments/assets/017941a8-200a-453f-b13d-3dc7ce75dad4" />
