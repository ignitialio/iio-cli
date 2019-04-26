#!/bin/sh

kubectl delete -f minikube-traefik/
# one by one
# kubectl delete -f minikube-traefik-ds.yaml
# kubectl delete -f minikube-traefik-ingress.yaml
kubectl delete -f traefik/traefik-rbac.yaml
