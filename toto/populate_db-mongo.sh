#!/bin/sh

docker-compose up -d mongo
sleep 1

./tools/populate_db-mongo.js

docker-compose stop mongo
docker-compose rm -f mongo
