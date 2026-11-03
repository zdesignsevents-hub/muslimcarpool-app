#!/bin/bash
args=()
for arg in "$@"; do
  fixed=$(echo "$arg" | sed 's|file:///C:|file://C:|g')
  args+=("$fixed")
done
exec git "${args[@]}"
