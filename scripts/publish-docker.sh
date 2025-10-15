#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI is required" >&2
  exit 1
fi

IMAGE_NAME=${1:-}
TAG=${2:-latest}

if [[ -z "$IMAGE_NAME" ]]; then
  echo "Usage: $0 <image-name> [tag]" >&2
  echo "Example: $0 your-dockerhub-user/prospect-portal v1" >&2
  exit 1
fi

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)

pushd "$REPO_ROOT" >/dev/null

echo "Building $IMAGE_NAME:$TAG"
docker build -t "$IMAGE_NAME:$TAG" .

echo "Pushing $IMAGE_NAME:$TAG"
docker push "$IMAGE_NAME:$TAG"

echo "Published $IMAGE_NAME:$TAG"

popd >/dev/null
