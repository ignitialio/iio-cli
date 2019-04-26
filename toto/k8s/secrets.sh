#!/bin/sh

echo "Creates secrets from ${IIO_K8S_SECRETS_PATH}"
kubectl create -f $IIO_K8S_SECRETS_PATH
