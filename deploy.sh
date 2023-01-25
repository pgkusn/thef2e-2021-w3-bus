#!/usr/bin/env sh

# 發生錯誤時終止
set -e

# 建構
npm run build

# 進入建構資料夾
cd dist

# 放置 .nojekyll 以繞過 Jekyll 的處理。
echo > .nojekyll

git init
git checkout -B main
git add -A
git commit -m 'deploy'

# 部署在 https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:pgkusn/thef2e-2021-w3-bus.git main:gh-pages

cd -
