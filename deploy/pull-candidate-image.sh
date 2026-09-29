#!/usr/bin/env bash
set -euo pipefail

# The GitHub token arrives on stdin, never in a command argument or log.
digest="${1:?Expected image digest}"
commit_sha="${2:?Expected commit SHA}"
actor="${3:?Expected GitHub actor}"
[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ && "$commit_sha" =~ ^[0-9a-f]{40}$ ]]
[[ "$actor" =~ ^[A-Za-z0-9-]+$ ]]

docker_config="$(mktemp -d)"
chmod 700 "$docker_config"
export DOCKER_CONFIG="$docker_config"
trap 'rm -rf -- "$docker_config"' EXIT

docker login ghcr.io -u "$actor" --password-stdin > /dev/null
image="ghcr.io/octabech/dailynagger-server@$digest"
docker pull "$image"
docker tag "$image" "dailynagger-server:$commit_sha"
docker image inspect "dailynagger-server:$commit_sha" > /dev/null
echo "Candidate server image pulled by digest and tagged for this commit."
