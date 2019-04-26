# Deploy from Swarm Master
# ------------------------

#!/bin/sh

echo "Deploying on $1..."
echo "Prepare docker-compose.yml..."
cat template.docker-compose.yml | sed "s/iiozero/$1/g" > docker-compose.yml

echo "Copy compose file to remote deploy endpoint on iiozero..."
cp docker-compose.yml /opt/dep

echo "Pull images on $1..."
ssh ignitial@$1 'bash -s' < remote/pull_images.sh

echo "Deploy remote from iiozero to $1..."
./remote/stack_deploy.sh

echo "...DONE."