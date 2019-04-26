#!/bin/sh

. ./set_k8s_env.sh

# Create issuer in a given namespace
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete -n cert-manager -f cert-manager/issuer.yaml
