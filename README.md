# movie-book-labo

読書、漫画、映画、ドラマ、ゲームの鑑賞記録をスマホで残すための React + TypeScript + Vite アプリです。

## できること

- カテゴリ別に記録する
- 作品名、どのくらいやったか、気持ち、気づきを保存する
- 検索する
- カテゴリで絞り込む
- 編集する
- 削除する

記録はブラウザの localStorage に保存されます。

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## GitHub Pages

`.github/workflows/deploy.yml` を入れてあります。GitHub の Pages 設定で Source を `GitHub Actions` にすると、`main` ブランチへの push で公開できます。
