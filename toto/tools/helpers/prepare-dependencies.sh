#!/bin/sh

echo "Create mandatory folders..."
mkdir -p ~/iio-data
mkdir -p ~/iio-data/mongo
mkdir -p ~/iio-data/minio
mkdir -p ~/iio-data/minio/config
mkdir -p ~/iio-data/minio/data

echo "Copy Minio configuration..."
cp -f tools/helpers/minio/config.json ~/iio-data/minio/config

echo "Prepare dev start bash file..."
cp tools/helpers/_start.sh dev_start.sh
