# Ignitial.io apps and services bootstrap and Kubernets/Swarm deploy

Deploy micro-services based cluster with web application front-end in minutes and 3 lines
of shell commands:  

[![asciicast](https://asciinema.org/a/HCCJ3KFo5DOqSdPlYw929WzKf.svg)](https://asciinema.org/a/HCCJ3KFo5DOqSdPlYw929WzKf)

  
## Install

```bash
npm install -g @ignitial/iio-cli
```

## Test

```bash
export IIOS_CLI_CFG_PATH=test

node src/index.js templates
```

## Usage

See tool's help:

```bash
iio
```

### Create a new Ignitial.io app from scratch

```bash
iio create app myUberApp
...
```  

### Deploy existing app to a Kubernetes cluster

```bash
...
# cd to app folder or use -w option to define working directory
cd myUberApp
# -l: use minikube
iio deploy -l
```

### Delete exsiting deployment

```bash
# you must be in the app folder or use -w option to define working directory
# -l: use minikube
iio remove -l
```

### Create a new Ignitial.io service from scratch

```bash
iio create service myUberService
...
```  
