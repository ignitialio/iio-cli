#!/bin/sh

./clean-app.sh
./clean-redis.sh
./clean-traefik.sh

kubectl delete secret iiosecrets
kubectl delete secret regcred

# minikube stop

# restore /etc/hosts
sudo mv /etc/hosts.beforekube /etc/hosts
