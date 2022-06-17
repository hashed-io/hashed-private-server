#!/usr/bin/env bash

usage="./start-hasura-only"
if [ $# -ne 0 ]; then
    echo $usage
    exit 1
fi

script_path="$(dirname $(realpath ${BASH_SOURCE[0]}))"

pushd $script_path

cp .env.hasura-only .env
docker-compose up -d