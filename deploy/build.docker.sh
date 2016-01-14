#!/bin/bash

if [[ $# -ne 1 ]]; then
	echo "You must provide the version number to build..."
	exit 1
fi

basebuild="WEEK-$(date +%W)_DATE-$(date +%b-%Y)"
version=$1

docker build -t="node-api-template" --build-arg "VERSION=${version}" --build-arg "BASEBUILD=${basebuild}" .
