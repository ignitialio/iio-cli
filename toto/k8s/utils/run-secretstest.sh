#!/bin/sh

kubectl create -f ./busybox-pod.yaml

# check kub-dns status
./wait-for.sh pod busybox

# get resolvs
kubectl exec -ti busybox env

# clean
kubectl delete -f ./busybox-pod.yaml
