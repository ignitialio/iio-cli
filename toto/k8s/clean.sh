#!/bin/sh

. ./set_k8s_env.sh

# delete
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete -f app/app-deploy.yaml

kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete -f redis/
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete -f traefik/

kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete secret iiosecrets
kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} delete secret regcred

kubectl --kubeconfig ${IIO_K8S_KUBECONFIG_PATH} label nodes amd64-master-1 nodetype-
