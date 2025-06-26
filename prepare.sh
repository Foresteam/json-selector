(
  mkdir .husky;
  pnpm exec husky \
  && echo 'pnpm run lint-full' > .husky/pre-push \
  && echo 'pnpm run lint-staged' > .husky/pre-commit \
  && echo 'pnpm exec commitlint --edit $1' > .husky/commit-msg \
  || true
)