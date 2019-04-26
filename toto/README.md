# toto app

# Creation

This folder has been created as below:

```bash
# installs IIO CLI tool
npm install -g @ignitial/iio-cli

# create an app with name atest (creates folder as well)
iio create app atest
```

# install dependencies

```bash
npm i
```

# build data lake docker image for data access

```bash
npm run build:dlake:image
```

# create all the local dependencies (ex: folders, minio configuration etc.)

```bash
./tools/helpers/prepare-dependencies.sh
```

# use bash file create by the previous step to start application server

```bash
./dev_start.sh
```

## clean up

```bash
./clean.sh
```

# start with minikube

```bash
minikube start

cd k8s
./minikube_cluster.sh
```

## clean up

```bash
cd k8s
./minikube_clean.sh
```
