#!/bin/sh

# make a copy of /etc/hosts
sudo cp /etc/hosts /etc/hosts.beforekube

# sets app version
APP_VERSION=$(cat ../package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "get app version..."
cat templates/minikube-app-deploy.template.yaml | sed "s/APP_VERSION/$APP_VERSION/g" > app/minikube-app-deploy.yaml

# minikube start

. ./set_k8s_env.sh

# docker registry
kubectl create secret generic regcred \
    --from-file=.dockerconfigjson=${IIO_K8S_REGISTRY_CONFIG_PATH} \
    --type=kubernetes.io/dockerconfigjson

# create K8S secrets from credential file
./secrets.sh

# start traefik
./start-traefik.sh

# start Redis
./start-redis.sh

# wait for redis
echo "wait for redis ready..."
sleep 5

# start app
./start-app.sh

# declare local domain/host for traefik routing
# WARNGING: DON'T FORGET TO CLEAN UP
echo "$(minikube ip) toto.minikube" | sudo tee -a /etc/hosts

# Manual
# kubectl get pods
# kubectl exec redis-59b74576b6-vwsn4 -- printenv | grep SERVICE

# kubectl port-forward deployment/redis 6379:6379
