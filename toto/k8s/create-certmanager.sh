#!/bin/sh

. ./set_k8s_env.sh

# Create a namespace to run cert-manager in
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} create namespace cert-manager

# Disable resource validation on the cert-manager namespace
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} label namespace cert-manager certmanager.k8s.io/disable-validation=true

# Install the CustomResourceDefinitions and cert-manager itself
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.7/deploy/manifests/cert-manager.yaml
