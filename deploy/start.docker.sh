#!/bin/bash

port=80

docker run -d \
  --name="node-api-template" \
  --restart="always" \
  -e "NODE_PORT=${port}" \
  node-api-template:latest

