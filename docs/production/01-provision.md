---
id: provision
title: Provision
---

This page has details on how to create the initial infrastructure needed to run an Appcket based app on a Kubernetes cluster of your choosing.

## DigitalOcean (DOKS)

The approximate [monthly price](https://www.digitalocean.com/pricing/) for all of the resources needed in this guide is $80.

### Setup the DevOps machine

You will need either a dedicated VM or perhaps another laptop that is designated as the DevOps machine to interact with your DigitOcean resources (Container Registry and Kubernetes, building and pushing images, etc.).

The Ubuntu OS is recommended and you will need to install the following:

1. [Node.js](https://github.com/nodesource/distributions/blob/master/README.md#debinstall)
1. [pnpm](https://pnpm.io/installation)
1. [Docker Engine and Docker Compose](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)
    * Add user to docker group
        * `sudo usermod -aG docker {USER}` (replace `{USER}` with your linux username)
1. [Kubernetes CLI, kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/) to manage the DOK cluster and install the app's Helm charts
1. [DOCLT](https://docs.digitalocean.com/reference/doctl/how-to/install/) to manage the DOK cluster, communicate securely with your private container registry and pull images it needs to run in your cluster.
1. [Istio and setup istioctl bin](https://istio.io/latest/docs/setup/getting-started/#download)
1. [Certbot](https://www.digitalocean.com/community/tutorials/how-to-acquire-a-let-s-encrypt-certificate-using-dns-validation-with-certbot-dns-digitalocean-on-ubuntu-20-04)
    * Complete the first two steps in this tutorial.
1. [psql](https://www.postgresql.org/docs/current/app-psql.html)
    * `sudo apt update`
    * `sudo apt install -y postgresql-client`
1. [Helm](https://helm.sh/docs/intro/install/#from-apt-debianubuntu) - 3+

### Clone the repo and your production branch/tag

:::note

When running any commands below with `{PROJECT_MACHINE_NAME}`, change this to your own project's name.

:::

On the DevOps machine, clone the repo at your production tag or branch.

```
git clone https://github.com/appcket/appcket-org.git -b main {PROJECT_MACHINE_NAME}
```
### Provision resources with Terraform

We will use Hashicorp's Terraform to provision the DigitalOcean resources in an automated way.

Terraform files specific for DO are provided in `deployment/environment/production/provision/digitalocean`.

Setup Terraform with DO according to the [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-use-terraform-with-digitalocean).

The private key file name in this example is `id_rsa`. If you have a different key file name, change it in the terraform commands below.

:::note

When you create your Personal Access Token, you can use "terraform-digitalocean-key" as the name. If you choose a different PAT name, be sure to change it in deployment/environment/production/provision/digitalocean/main.tf file.

:::

Ensure you are in the correct directory
```
cd deployment/environment/production/provision/digitalocean
```

Initialize Terraform

```
terraform init
```

Run the terraform plan command to see what Terraform will do

```
terraform plan \
  -var "do_token={DO_PAT}" \
  -var "pvt_key=$HOME/.ssh/id_rsa"
```

Apply terraform plan which will take a few minutes while it creates the specified resources in your DigtalOcean account. 

:::note

If you previously set the name servers for your domain to DigitalOcean, you may need to re-set the name servers now to something else and wait an appropriate amount of time for the changes to propogate. Otherwise, you might see an error after running the command below *domain 'YourDomainName.com': name already exists*.

:::

```
terraform apply \
  -var "do_token={DO_PAT}" \
  -var "pvt_key=$HOME/.ssh/id_rsa"
```

Check your DigitalOcean control panel that all resources were created (Project, Database, Kubernetes Cluster, Domain, Private Container Registry + a Load Balancer that DO creates for you automatically on K8s cluster creation)

1. Use the doctl cli client to communicate with Kubernetes cluster
    ```
    doctl kubernetes cluster kubeconfig save {PROJECT_MACHINE_NAME}-k8s-cluster
    ```
1. Make sure your context is set to your Kubernetes cluster
    ```
    kubectl config current-context
    ```
1. The above result should print "do-nyc1-`{PROJECT_MACHINE_NAME}`-k8s-cluster"
1. Install Istio into Kubernetes cluster
    ```
    istioctl install --set profile=default -y
    ```
    1. Add namespace label
        ```
        kubectl label namespace default istio-injection=enabled
        ```
1. Create the Kubernetes namespace the services will use
    ```
    kubectl create namespace {PROJECT_MACHINE_NAME}
    ```

### Connect Kubernetes cluster with Private Container Registry

Follow this tutorial on how to use your [Private DigitalOcean Container Registry with Docker and Kubernetes](https://docs.digitalocean.com/products/container-registry/how-to/use-registry-docker-kubernetes/).

Be sure to follow "Option 1: Adding Secret to All Namespaces in Kubernetes Clusters (Recommended)" when you get to that section.

### Create Kubernetes secrets

```
kubectl create secret generic database-secret --from-literal=user=dbuser --from-literal=password={DATABASE_PASSWORD} -n {PROJECT_MACHINE_NAME}
```

:::danger

The default API_CLIENT_KEYCLOAK_SECRET is found in `deployment/bootstrap.sh`. Use that value for the following command, but you will need to immediately create a new api client secret and keycloakClientPublicKey (found in `deployment/helm/values-production.yaml`) using the admin Keycloak account and re-deploy using this new value!

:::

```
kubectl create secret generic api-keycloak-client-secret --from-literal=clientsecret={API_CLIENT_KEYCLOAK_SECRET} -n {PROJECT_MACHINE_NAME}
```

### CoreDNS
Delete any previous configmaps named coredns

```
kubectl delete configmap coredns -n kube-system
```

### Manage (sub)domains and TLS certificates

#### Set name servers with your domain registrar

Using your domain registrar's control panel, delegate your domain by [pointing it to DigitalOcean’s name servers](https://docs.digitalocean.com/tutorials/dns-registrars/):

1. `ns1.digitalocean.com.`
1. `ns2.digitalocean.com.`
1. `ns3.digitalocean.com.`

#### Add Subdomains

1. Create A records to [Add Subdomains](https://docs.digitalocean.com/products/networking/dns/how-to/add-subdomain/) and **direct to the load balancer**
    * `accounts`
    * `app`
    * `api`
1. Create an A record `@` for the apex domain `{PROJECT_MACHINE_NAME}`.com and **direct to the load balancer**.

#### Create production TLS certificates

Use cert-bot DNS method to create certificates (`{PROJECT_MACHINE_NAME}`.com, accounts.`{PROJECT_MACHINE_NAME}`.com, app.`{PROJECT_MACHINE_NAME}`.com, api.`{PROJECT_MACHINE_NAME}`.com).

Change ".com" to whatever is your top level domain.

```
sudo certbot certonly --dns-digitalocean --dns-digitalocean-credentials ~/certbot-creds.ini -d {PROJECT_MACHINE_NAME}.com
```

```
sudo certbot certonly --dns-digitalocean --dns-digitalocean-credentials ~/certbot-creds.ini -d accounts.{PROJECT_MACHINE_NAME}.com
```

```
sudo certbot certonly --dns-digitalocean --dns-digitalocean-credentials ~/certbot-creds.ini -d app.{PROJECT_MACHINE_NAME}.com
```

```
sudo certbot certonly --dns-digitalocean --dns-digitalocean-credentials ~/certbot-creds.ini -d api.{PROJECT_MACHINE_NAME}.com
```

### Copy and rename certs to their specific directory

cd to be inside the root of your git project.

```
sudo chmod 644 /etc/letsencrypt/live/{PROJECT_MACHINE_NAME}.com/privkey.pem
```
```
sudo chmod 644 /etc/letsencrypt/live/accounts.{PROJECT_MACHINE_NAME}.com/privkey.pem
```
```
sudo chmod 644 /etc/letsencrypt/live/app.{PROJECT_MACHINE_NAME}.com/privkey.pem
```
```
sudo chmod 644 /etc/letsencrypt/live/api.{PROJECT_MACHINE_NAME}.com/privkey.pem
```

1. Accounts
    ```
    sudo cp /etc/letsencrypt/live/accounts.{PROJECT_MACHINE_NAME}.com/fullchain.pem accounts/tls.crt
    ```
    ```
    sudo cp /etc/letsencrypt/live/accounts.{PROJECT_MACHINE_NAME}.com/privkey.pem accounts/tls.key
    ```
    ```
    sudo cp /etc/letsencrypt/live/accounts.{PROJECT_MACHINE_NAME}.com/fullchain.pem api/certs/accounts.tls.crt
    ```
    ```
    sudo cp /etc/letsencrypt/live/accounts.{PROJECT_MACHINE_NAME}.com/privkey.pem api/certs/accounts.tls.key
    ```
1. Api
    ```
    sudo cp /etc/letsencrypt/live/api.{PROJECT_MACHINE_NAME}.com/fullchain.pem api/certs/api.tls.crt
    ```
    ```
    sudo cp /etc/letsencrypt/live/api.{PROJECT_MACHINE_NAME}.com/privkey.pem api/certs/api.tls.key
    ```
    ```
    sudo cp /etc/letsencrypt/live/api.{PROJECT_MACHINE_NAME}.com/fullchain.pem api/certs/rootCA.crt
    ```
1. App
    ```
    sudo cp /etc/letsencrypt/live/app.{PROJECT_MACHINE_NAME}.com/fullchain.pem app/certs/app.tls.crt
    ```
    ```
    sudo cp /etc/letsencrypt/live/app.{PROJECT_MACHINE_NAME}.com/privkey.pem app/certs/app.tls.key
    ```
1. Marketing
    ```
    sudo cp /etc/letsencrypt/live/{PROJECT_MACHINE_NAME}.com/fullchain.pem marketing/certs/tls.crt
    ```
    ```
    sudo cp /etc/letsencrypt/live/{PROJECT_MACHINE_NAME}.com/privkey.pem marketing/certs/tls.key
    ```
1. Database
    * DigitalOcean requires tls connection to the database. So you need to download the `ca-certificate.crt` from the control panel and copy it to the `api/certs` folder

### Set up accounts schema and data

Using a psql client, execute the following commands to setup the accounts (Keycloak).
Find the DATABASE_HOST and DATABASE_PASSWORD in your DigitalOcean database control panel.

Note: the main `appcket` database was already created with the terraform apply step above.

1. cd into the ` deployment` directory.

```
psql -c "CREATE SCHEMA IF NOT EXISTS keycloak; GRANT CREATE ON DATABASE {PROJECT_MACHINE_NAME} TO dbuser;" "dbname={PROJECT_MACHINE_NAME} user=doadmin password={DATABASE_PASSWORD} host={DATABASE_HOST} port={DATABASE_PORT}"
```

Note: Using the `doadmin` account, we granted the `dbuser` privilege to create the `appcket` schema for creating the application tables and seed data in the next section.

```
psql -f ./environment/local/keycloak_dump.sql "dbname={PROJECT_MACHINE_NAME} user=doadmin password={DATABASE_PASSWORD} host={DATABASE_HOST} port={DATABASE_PORT}"
```

Note: the `dbuser` was set as the `keycloak` schema owner after running the `keycloak_dump.sql` script above. 

### Create tables and seed application data

MikroOrm CLI is used to migrate and seed the initial data for the application.

1. `cd database` - if you are already inside the deployment folder
1. modify the values in mikro-orm.config.ts to match your production database values.
    * Note: DigitalOcean requires ssl connection, so you need to download the ca-certificate.crt from the control panel and copy to the deployment/database folder and uncomment the appropriate lines in mikro-orm.config.ts.
1. `pnpm install` - if packages not already installed
1. `pnpm schema-seed`
1. `pnpm post-seed`

You are now ready to [build and deploy to production](./build-deploy).

### Destroy all resources and project

:::danger

This will destroy all resources, be careful!

:::

```
terraform plan -destroy -out=terraform.tfplan \
-var "do_token=${DO_PAT}" \
-var "pvt_key=$HOME/.ssh/id_rsa"
```

```
terraform apply terraform.tfplan
```

## Amazon (EKS)

Help is needed here to document the steps for provisioning the necessary AWS resources; similar to the DigitalOcean steps above.
