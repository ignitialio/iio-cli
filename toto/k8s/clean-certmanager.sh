#!/bin/sh

. ./set_k8s_env.sh

kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.7/deploy/manifests/cert-manager.yaml
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} label namespaces cert-manager certmanager.k8s.io/disable-validation-
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete namespaces cert-manager
