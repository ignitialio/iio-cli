#!/bin/sh

cd /opt/dep
docker stack deploy -c docker-compose.yml toto