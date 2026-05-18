#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REMOTE="${RELEASE_REMOTE:-origin}"
BRANCH="${RELEASE_BRANCH:-$(git branch --show-current)}"
VERSION="$(node -p "require('./package.json').version")"
TAG="v${VERSION}"

if [[ -z "$BRANCH" ]]; then
  echo "当前不在普通 Git 分支上，无法发布。"
  exit 1
fi

if [[ "$VERSION" == "undefined" || -z "$VERSION" ]]; then
  echo "没有读取到 package.json 中的 version。"
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]]; then
  echo "package.json version 不符合 SemVer 格式：$VERSION"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "工作区存在未提交改动，请先提交后再发布。"
  git status --short
  exit 1
fi

echo "准备发布 ${TAG}"
echo "当前分支：${BRANCH}"
echo "远端仓库：${REMOTE}"

echo "检查远端与 tag 状态..."
git fetch "$REMOTE" --tags

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "本地 tag 已存在：$TAG"
  exit 1
fi

if git ls-remote --exit-code --tags "$REMOTE" "refs/tags/${TAG}" >/dev/null 2>&1; then
  echo "远端 tag 已存在：$TAG"
  exit 1
fi

echo "运行发布前校验..."
npm run lint
npm test
npm run build

echo "推送当前分支..."
git push "$REMOTE" "$BRANCH"

echo "创建 tag：${TAG}"
git tag -a "$TAG" -m "Release ${TAG}"

echo "推送 tag，触发 GitHub Actions Release 和 Vercel 部署..."
git push "$REMOTE" "$TAG"

echo "发布已触发：${TAG}"
echo "后续请在 GitHub Actions 中查看 Release 和 Vercel 部署结果。"
