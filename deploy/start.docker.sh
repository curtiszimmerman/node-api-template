#!/bin/bash

port=80

docker run -d \
  --name="node-api-template" \
  --restart="always" \
  -e "NODE_PORT=${port}" \
  -e "NODE_DEBUG=5" \
  -e "NODE_STATIC=true" \
  node-api-template:latest

