#!/bin/sh

kubectl apply -f traefik/traefik-rbac.yaml
kubectl apply -f minikube-traefik/

# one by one
# kubectl apply -f minikube-traefik-ds.yaml
# kubectl apply -f minikube-traefik-ingress.yaml
