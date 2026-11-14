# Node.jsの公式イメージをベースとする
FROM node:22 AS builder

# 作業ディレクトリを指定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci --no-audit --no-fund

# scripts/build-image.mjsで準備したコンテキストのみを使用する
COPY tenant-build.json ./tenant-build.json

# 共通コードと選択テナントの設定・素材をコピー
COPY . .

# 公開用Firebase設定はビルド時にブラウザ向けコードへ埋め込まれる
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

# TypeScriptコンパイルとNext.jsのビルド
RUN node node_modules/next/dist/bin/next build

# 本番環境用のイメージ
FROM node:22-slim

WORKDIR /app

# ビルドしたファイルをコピー
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tenant-build.json ./tenant-build.json

# 環境変数
ENV NODE_ENV=production

# アプリケーションがリッスンするポート番号を指定
EXPOSE 8080

# アプリケーションの起動コマンド
CMD ["npm", "start"]
