#!/bin/sh

export IIO_K8S_SECRETS_PATH=/home/vandrito/Documents/Data/Secrets/iio/app-secrets.yaml
echo "Sets IIO_K8S_SECRETS_PATH to ${IIO_K8S_SECRETS_PATH}"
export IIO_K8S_REGISTRY_CONFIG_PATH=/home/vandrito/.docker/config.json
echo "Sets IIO_K8S_REGISTRY_CONFIG_PATH to ${IIO_K8S_REGISTRY_CONFIG_PATH}"
export IIO_K8S_KUBECONFIG_PATH=/home/vandrito/Documents/Projects/iio/devops/k8s-scw-baremetal/amd64.conf
echo "Sets IIO_K8S_REGISTRY_CONFIG_PATH to ${IIO_K8S_KUBECONFIG_PATH}"
