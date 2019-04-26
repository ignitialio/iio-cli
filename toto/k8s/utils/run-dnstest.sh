#!/bin/sh

kubectl create -f ./busybox-pod.yaml

# check kub-dns status
./wait-for.sh pod busybox
kubectl exec -ti busybox -- nslookup kubernetes.default

# get resolvs
kubectl exec busybox cat /etc/resolv.conf

# clean
kubectl delete -f ./busybox-pod.yaml
