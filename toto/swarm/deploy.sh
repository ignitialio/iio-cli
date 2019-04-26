# Deploy from development host
# ----------------------------

#!/bin/sh

export APP_VERSION=$(cat ../package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "app version: ${APP_VERSION}"

echo "Deploying on $1..."
echo "Prepare docker-compose.yml..."
cat template.docker-compose.yml | sed "s/iiozero/$1/g" > docker-compose.yml

echo "Copy compose file to remote deploy endpoint on iiozero..."
scp docker-compose.yml ignitial@iiozero:/opt/dep

echo "Pull images on $1..."
ssh ignitial@$1 'bash -s' < remote/pull_images.sh

echo "Deploy remote from iiozero to $1..."
ssh ignitial@iiozero 'bash -s' < remote/stack_deploy.sh

echo "...DONE."
