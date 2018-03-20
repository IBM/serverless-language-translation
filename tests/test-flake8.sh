#!/bin/bash -e

# shellcheck disable=SC1090
source "$(dirname "$0")"/../scripts/resources.sh

num_proc=$(grep processor /proc/cpuinfo | tail -1 | cut -d ' ' -f2)
((num_proc++))

#shellcheck disable=SC2046,SC2086
if flake8 --jobs="$num_proc" --show-source --statistics $(dirname $0)/../.; then
    test_passed "$0"
else
    test_failed "$0"
fi
