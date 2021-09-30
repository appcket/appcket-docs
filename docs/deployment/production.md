---
id: production
title: Production
---

These docs are still a work in progress and need to be refined, mainly by adding helm chart steps. But the process is similar to setting up everything for local devlopment.

This page has details on how to deploy an Appcket based application to a production Kubernetes cluster.

## Digital Ocean

For deploying to DigialOcean, we can leverage the following offerings: Droplet (regular VM), Kubernetes service, Load Balancer, Private Container Registry, and Managed Postgres database.

The approximate [monthly price](https://www.digitalocean.com/pricing/) for all of this is $60. You might be able to save a little money by hosting your own container registry and database server, but it is recommended to use the available services for these items.

### Droplet (Optional)

A dedicated Droplet can be used as the Kubernetes Administration machine that connects to the cluster and allow us to run kubectl commands. It also can serve as build server by installing Jenkins to build and push container images to the registry. Otherwise, these steps can be performed on a local laptop that will serve as a place to run kubectl commands and builds.

#### Droplet specs

* RAM: 2GB
* CPUs: 1
* Price: $10/mo
* OS: Ubuntu 20.04

#### Initial Setup

1. Create a new **Ubuntu 20.04** Droplet in the DigitalOcean UI and add a public key according to the instructions before creating.
1. After creating the droplet, on your laptop:
    * eval `ssh-agent -s`
    * `ssh-add ~/.ssh/id_rsa` where id_rsa is the file with your ssh key
    * `ssh root@xxx.xxx.xxx`
1. Once you are connected to the new machine, [set up new user and turn off root login](https://www.digitalocean.com/docs/droplets/tutorials/recommended-setup/).
1. [Install Docker](https://docs.docker.com/engine/install/ubuntu/)
    * Add user to docker group
        * `sudo usermod -aG docker ${USER}` (replace ${USER} with your linux username created from previous step)
1. [Install Docker Compose](https://docs.docker.com/compose/install/)
1. [Install Kubernetes CLI, kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) to manage the DOK cluster
1. [Install DOCLT](https://github.com/digitalocean/doctl) to manage the DOK cluster
1. Set up a [Managed Postgres Database](https://www.digitalocean.com/products/managed-databases/) on DigitalOcean - Starting at $15/mo
1. Build/download all necessary docker images
    * `cd deployment`
    * `./build.sh -e production`
1. Set up a Private Registry on DigitalOcean - Basic, $5/mo
1. Tag images
    * `docker tag appcket_accounts registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_accounts:v0.0.1`
    * `docker tag appcket_api registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_api:v0.0.1`
    * `docker tag appcket_app registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_app:v0.0.1`
    * `docker tag appcket_marketing registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_marketing:v0.0.1`
1. Push images to registry
    * `docker push registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_accounts:v0.0.1`
    * `docker push registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_api:v0.0.1`
    * `docker push registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_app:v0.0.1`
    * `docker push registry.digitalocean.com/{YourAppName}-production-registry-01/appcket_marketing:v0.0.1`
1. Create "appcket" database using DBeaver or similar tool (TODO: script this in environment/production/initial-db-setup.sql). The "appcket" and "keycloak" schemas will be created after running the initial SQL scripts below
    1. Enable the uuid-ossp extension so UUIDs can be created on INSERT of new rows by adding the following SQL underneath the `CREATE schema appcket;` line in `deployment/environment/production/appcket_dump.sql`

            SET search_path TO appcket;
            DROP EXTENSION IF EXISTS "uuid-ossp";
            CREATE EXTENSION "uuid-ossp" SCHEMA appcket;`

    1. Import the appcket inital data by running the `deployment/environment/production/appcket_schema.sql` script
    1. Import the keycloak inital data by running the `deployment/environment/production/keycloak_schema.sql` script

### Kubernetes

1. Create a cluster in DigitalOcean UI
    1. 1 node, $20/mo
1. Follow the Getting started guide using the Droplet created above or your local laptop as the administration machine for interacting with this cluster.
    1. TIP: I wasn't able to connect to the cluster using the `kubectl --kubeconfig="use_your_kubeconfig.yaml" get nodes` command the guide suggested. I had to rename the .yaml config file to "config" and put it in ~/.kube folder.Only then would commands like `kubectl get svc` work. Otherwise, I would always get "The connection to the server localhost:8080 was refused - did you specify the right host or port?" error when running kubectl commands. This was using kubectl v1.20.1 trying to connect to a v1.19.3 cluster.
1. [Download Istio and setup istioctl bin](https://istio.io/latest/docs/setup/getting-started/#download)
    1. Install Istio into Kubernetes cluster
        * `istioctl manifest install -y`
    1. Add namespace label
        * `kubectl label namespace default istio-injection=enabled`
1. Create the Kubernetes namespace the services will use
    * `kubectl create namespace appcket`
1. [Install Cert Manager](https://cert-manager.io/docs/installation/kubernetes/#installing-with-regular-manifests)
    * `kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.1.0/cert-manager.yaml`
1. [Create a DigitalOcean Personal Access token with Write access](https://cloud.digitalocean.com/account/api/tokens/new)
    1. See the [cert-manager DigitalOcean docs](https://cert-manager.io/docs/configuration/acme/dns01/digitalocean/) for more information
    1. Add the base64 encoded version of this token to the cert.yaml file in the Secret data.access-token value
    * TODO: add this token to Vault and be able to access it from Vault
1. Apply the cert.yaml file to your k8s cluster (in the istio-system namespace)
    * `kubectl apply -f ./environment/production/resource-manifests/cert.yaml -n istio-system`
1. Start Istio Gateway resource
    * `kubectl apply -f ./environment/production/resource-manifests/gateway.yaml -n appcket`
1. Apply Core DNS config
    * `kubectl apply -f ./environment/production/resource-manifests/dns.yaml -n kube-system`
1. Start accounts, api and app
    * `kubectl apply -f ./environment/production/resource-manifests/accounts.yaml -n appcket`
    * `kubectl apply -f ./environment/production/resource-manifests/api.yaml -n appcket`
    * `kubectl apply -f ./environment/production/resource-manifests/app.yaml -n appcket`
1. Exec into app and api services to start
    * `kubectl exec -n appcket -it svc/api -- bash`
    * `kubectl exec -n appcket -it svc/app -- bash`
1. Fix accounts keycloak schema missing error
1. Convert/update certs in environment/production/certs/accounts to be real letsencrypt certs

## Amazon

### EKS

Help is needed here to document the steps for deploying to Amazon; similar to the DigitalOcean steps above.