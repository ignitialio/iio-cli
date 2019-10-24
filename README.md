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

Your _myUberApp_ application, bootstrapped with iio, has a Kubernetes deploy
configuration file that you can find in the _myUberApp/k8s/deploy_ folder.

```yaml
# IIOS deploy configuration file apiVersion
apiVersion: 1
# registries to use for image pull (referenced in the app config section)
registries:
  # reference name (use JSON path to query info)
  GitLab:
    # name of the registry domain (think docker login <domain>)
    domain: registry.gitlab.com/
    # configuration data for credentials: here uses a file content
    configData: "{{filedata(~/.docker/config.json)}}"
  # use no registry when local or Docker Hub images
  Local:
    domain: ""
# IIOS app and services section
iios:
  # app section
  app:
    # app image version; here gets from app's package.json file
    version: "{{packageJSON.version}}"
    # use private registry if necessary (prod deploy)
    # registry: "{{$.registries.GitLab}}"
    # this config example uses no registry, so either Docker Hup or local images
    # (ex: deployment made with minikube)
    registry: "{{$.registries.Local}}"
    # app image pull policy
    imagePullPolicy: IfNotPresent
    # app number of replicas
    replicas: 1
  # services section
  services:
    # mandatory dlake service
    dlake:
      # service image version
      version: 3.1.0
      # service number of replicas
      replicas: 1
      # ports configuration for the service deployment
      ports:
        - containerPort: 20194
          name: dt-service
        - containerPort: 20195
          name: dt1
        - containerPort: 20196
          name: dt2
        - containerPort: 20197
          name: dt3
        - containerPort: 20198
          name: dt4
        - containerPort: 20199
          name: dt5
    # mandatory auth service
    auth:
      version: 1.1.0
      replicas: 1
      ports:
        - containerPort: 20295
# global cluster configuration
cluster:
  # cluster domain entry point (external access to the cluster)
  # here uses a local domain that has to be defined in the /etc/hosts file and
  # that needs to use LoadBalancer (MetalLB) provided IP
  domain: mini.kube
  # enable Let's Encrypt automated certificate provisioning
  letsEncrypt: false
  # secrets to be created
  secrets:
    # declare app-secrets (no other reference to the name) that is an YAML file
    # to apply to the cluster
    # WARINING: you must provide this file
    - name: app-secrets
      file: ~/data/app-secrets.yaml
  # ingress to use nginx|traefik. Default nginx
  ingress: nginx
  # path for the kube config file. This allows you to address any Kubernetes cluster
  # WARNING: kubectl must be installed on your machine
  kubeConfigPath: ~/.kube/config
```

Secrets file (here _~/data/app-secrets.yaml_) must be provided. It has to be similar
to the following:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: iiosecrets
type: Opaque
data:
  emailer_smtp_pass: <base64_string>
  mongodb_pwd: <base64_string>
  s3_access_key_id: <base64_string>
  s3_secret_access_key: <base64_string>
```

To deploy the full app:

```bash
...
# cd to app folder or use -w option to define working directory
cd myUberApp
iio deploy
```

### Delete exsiting deployment

```bash
# you must be in the app folder or use -w option to define working directory
iio remove
```

### Create a new Ignitial.io service from scratch

```bash
iio create service myUberService
...
```  
