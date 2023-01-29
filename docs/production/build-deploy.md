---
id: build-deploy
title: Build & Deploy
---

This page explains how to build the necessary Docker images and deploy them to your provisioned Kubernetes cluster of choice.

## DigitalOcean (DOKS)

### Build Docker images

Your DigitalOcean infrastructure should now be in place and you should have an authenticated doctl cli client installed. It's time to build and deploy the app.

1. [Authenticate your DevOps machine using doctl](https://docs.digitalocean.com/products/container-registry/how-to/use-registry-docker-kubernetes/#docker-integration) to be able to push images to your registry (if you haven't already done so)
    * ```
    doctl registry login

1. Build/download all necessary Docker images
    * ```
    cd deployment
    * ```
    chmod +x ./build.sh
    * ```
    ./build.sh -e production
1. Tag images
    * ````
    docker tag localhost:5000/{PROJECT_MACHINE_NAME}_accounts:v0.0.1 registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_accounts:v0.0.1
    * ```
    docker tag localhost:5000/{PROJECT_MACHINE_NAME}_api:v0.0.1 registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_api:v0.0.1
    * ```
    docker tag localhost:5000/{PROJECT_MACHINE_NAME}_app:v0.0.1 registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_app:v0.0.1
    * ```
    docker tag localhost:5000/{PROJECT_MACHINE_NAME}_marketing:v0.0.1 registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_marketing:v0.0.1
1. Push images to registry
    * ```
    docker push registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_accounts:v0.0.1
    * ```
    docker push registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_api:v0.0.1
    * ```
    docker push registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_app:v0.0.1
    * ```
    docker push registry.digitalocean.com/{PROJECT_MACHINE_NAME}-container-registry/{PROJECT_MACHINE_NAME}_marketing:v0.0.1

### Start containers

Modify values in `deployment/helm/values-production.yaml` to match your production values (database, image.repository).

1. Start containers by installing Appcket to cluster via Helm Chart in deployment folder
    * `helm package helm`
    * `helm install {PROJECT_MACHINE_NAME} ./{PROJECT_MACHINE_NAME}-0.1.0.tgz -n {PROJECT_MACHINE_NAME} -f helm/values-production.yaml --dry-run --debug`
    * `helm install {PROJECT_MACHINE_NAME} ./{PROJECT_MACHINE_NAME}-0.1.0.tgz -n {PROJECT_MACHINE_NAME} -f helm/values-production.yaml`

:::warning

The default Admin username and password is admin/admin. Please immediately login to accounts.{PROJECT_NAME}.com and change this to something strong! You can also change the username and password for the dummy user accounts.

:::

:::tip

You're pods should now be running and available in the browser

1. https://appcket.com
1. https://accounts.appcket.com
1. https://api.appcket.com
1. https://app.appcket.com

:::

## Amazon (EKS)

Help is needed here to document the steps for deploying to Amazon; similar to the DigitalOcean steps above.