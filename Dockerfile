# Node.jsの公式イメージをベースとする
FROM node:22 AS builder

# 作業ディレクトリを指定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci --no-audit --no-fund

# アプリのソースコードをコピー
COPY . .

# TypeScriptコンパイルとNext.jsのビルド
RUN npm run build

# 本番環境用のイメージ
FROM node:22-slim

WORKDIR /app

# ビルドしたファイルをコピー
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 環境変数
ENV NODE_ENV production

# アプリケーションがリッスンするポート番号を指定
EXPOSE 8080

# アプリケーションの起動コマンド
CMD ["npm", "start"]
