---
id: installation-initial-setup
title: Installation and initial setup
---

Please ensure your local development machine meets the [Prerequisites for Appcket](./prerequisites).

## First time setup

Docker Compose gives the ability to easily run containers in local development mode instead of executing individual Docker commands.
You will be running a local registry container that allows you to push and host images that k8s needs in order to start Services.
Using Kubernetes locally allows us to spin up services and create resources similar to production.

The following is needed to run everything the first time.

### Setup mounts and certs for localhost https development

1. Using Windows Terminal, create a bind mount directory from your Ubuntu home dev directory to the Docker host mount path by:
    1. `sudo mkdir -p /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/appcket`
    1. `sudo mount --bind /home/{YourUsername}/dev/appcket /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/appcket`
        1. need to do the above step every time you restart your computer :( but there is a handy start.sh script in deployment/environment/local you can use that does this plus some other local setup commands for you
    1. Use this path for the volume.hostPath.path value for mounting volumes in your k8s pods: `/run/desktop/mnt/host/wsl/docker-desktop-bind-mounts/Ubuntu/dev`. These paths are already set in the yaml resource-manifest files. This is just documented here as a note and something to be aware of.
    1. See this [github issue comment](https://github.com/docker/for-win/issues/7023#issuecomment-640142404) for more info
1. Create a root cert and make your host OS trust this root cert
    * `cd deployment/environment/local/certs`
    * `openssl genrsa -des3 -out rootCA.key 2048`
    * `openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 3650 -out rootCA.pem`
    * For Windows, use Manage Computer Certificates in Control Panel -> Administrative Tools -> Trusted Root Certificate Authorities -> All Tasks -> Import to import the deployment/environment/local/certs/rootCA.pem
1. Edit the deployment/environment/local/domainname.v3.ext and deployment/environment/local/star.domainname.v3.ext files and change the DNS.1 values to whatever localhost domain you need, ex: appcket.localhost.
1. Also edit domainname.localhost.csr.cnf and star.domainname.localhost.csr.cnf
1. Using OpenSSL (can use WSL/Ubuntu on Windows and cd to /mnt/c/Users/{YourUsername}/dev/appcket/deployment/environment/local/certs, or a dedicated docker container: `docker run --name openssl -d -i -t -v openssl-volume:/data subfuzion/openssl` and then shell into the container to run the following openssl commands with `docker exec -it openssl /bin/sh`) Create a key and a crt for appcket.localhost, accounts.appcket.localhost and *.appcket.localhost
    * Commands for creating crt and key. Make sure you are in the deployment/environment/local/certs directory. Use something strong for a passphrase.

        * ```openssl req -new -sha256 -nodes -out appcket.localhost.csr -newkey rsa:2048 -keyout appcket.localhost.key -config <( cat domainname.localhost.csr.cnf )```

        * ```openssl x509 -req -in appcket.localhost.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out appcket.localhost.crt -days 500 -sha256 -extfile domainname.localhost.v3.ext```

        * ```openssl req -new -sha256 -nodes -out star.appcket.localhost.csr -newkey rsa:2048 -keyout star.appcket.localhost.key -config <( cat star.domainname.localhost.csr.cnf )```

        * ```openssl x509 -req -in star.appcket.localhost.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out star.appcket.localhost.crt -days 500 -sha256 -extfile star.domainname.localhost.v3.ext```

        * ```openssl req -new -sha256 -nodes -out accounts.appcket.localhost.csr -newkey rsa:2048 -keyout accounts.appcket.localhost.key -config <( cat accounts.domainname.localhost.csr.cnf )```

        * ```openssl x509 -req -in accounts.appcket.localhost.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out accounts.appcket.localhost.crt -days 500 -sha256 -extfile accounts.domainname.localhost.v3.ext```
1. Copy the accounts.appcket.localhost.key and accounts.appcket.localhost.crt files to the accounts folder in certs and then rename them as tls.key and tls.crt
    1. These files get copied to the container on image build. This is needed to run the accounts service (Keycloak) with TLS non-terminated at the Istio gateway. We need the accounts service to run internally with tls enabled.
1. 1. Copy the rootCA.crt, star.appcket.localhost.key, star.appcket.localhost.files to the api/certs folder so the api can trust the accounts self signed cert when it makes https calls to accounts to verify a token or check permissions. Also copy to app/certs and marketing/certs so the app and marketing site can run in https mode.

### Docker and k8s Setup

1. Create a persistent named volume for local dockerized Postgres to store data on the host
    * `docker volume create --name appcket-database -d local`
    * This is used in the deployment/environment/local/docker-compose.yml file
1. Build/download all necessary docker images
    * `cd deployment/environment/local`
    * `docker-compose -p appcket build`
1. Comment out `accounts`, `nodejs` entries in docker-compose.yml file
    * CAVEAT: If you ever need to re-build any of these images (ex. updating Keycloak version), remember to uncomment them, build, and then re-comment. And also re-tag and re-push the updated images to the docker registry.
1. Start registry, database and Vault containers
    * `docker-compose -p appcket up --build -d`
1. Setup Local Vault
    * Visit [https://vault.appcket.localhost:8200/](https://vault.appcket.localhost:8200/) to Unseal and login to your local Vault server. Download and keep the vault-cluster-vault-*.json file since it has the master keys and root token you will need anytime you want to login to Vault. TODO: get Vault and OIDC provider auth working with local Accounts instance.
1. Tag images
    * `docker image tag appcket_accounts localhost:5000/appcket_accounts; docker image tag appcket_nodejs localhost:5000/appcket_nodejs;`
1. Push images to registry
    * `docker push localhost:5000/appcket_accounts; docker push localhost:5000/appcket_nodejs;`
1. Hardcode the following host entries in your hosts file (on Windows it's @ C:\Windows\System32\drivers\etc\hosts and Linux is usually /etc/hosts)
    * `127.0.0.1 appcket.localhost accounts.appcket.localhost app.appcket.localhost api.appcket.localhost vault.appcket.localhost`
1. Create "appcket" database, "keycloak" and "appcket" schemas using DBeaver or similar tool (TODO: script this in environment/local/initial-db-setup.sql)
    1. Enable the uuid-ossp extension so UUIDs can be created on INSERT of new rows
        - `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    1. Import the deployment/environment/local/appcket_schema.sql file into the appcket schema
    1. Import the deployment/environment/local/keycloak_schema.sql file into the keycloak schema
1. Create the Kubernetes namespace the services will use
    * `kubectl create namespace appcket`
1. Secret management is done using [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/#use-case-pods-with-prod-test-credentials) that get consumed by pods as environment variables
    1. Create Kubernetes secrets for database credentials (change the actual password to something strong!!)
        * `kubectl create secret generic database-secret --from-literal=user=appcketuser --from-literal=password=password -n appcket`
    1. Create Kubernetes secrets for Keycloak admin credentials (change the actual password to something strong!!)
        * `kubectl create secret generic accounts-secret --from-literal=adminuser=admin --from-literal=adminpassword=admin -n appcket`
    1. Create Kubernetes secret for Keycloak api client secret (change the actual clientsecret value to the value of your api client secret found in the Keycloak admin ui!!)
        * `kubectl create secret generic api-keycloak-client-secret --from-literal=clientsecret=f672f858-89aa-45a0-991a-716d25afe2ed -n appcket`
1. Install istio configuration profile: `istioctl.exe manifest install -y`
1. Check External IP value is not `<none>` or `<pending>`
    * `kubectl get svc istio-ingressgateway -n istio-system`
1. Set Ingress IP and Ports
    * If External IP value is an ip address, use: `export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')`
    * If External IP value is a hostname like localhost, use: `export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')`
    * `export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')`
    * `export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="https")].port}')`
1. Enable Istio sidecar injection for the namespace
    * `kubectl label namespace appcket istio-injection=enabled`
1. Install Appcket to cluster via Helm Chart in deployment folder
    * `cd deployment/helm`
    * `helm package helm`
    * `helm install appcket ./appcket-0.1.0.tgz -n appcket -f helm/values-local.yaml --dry-run --debug`
    * `helm install appcket ./appcket-0.1.0.tgz -n appcket -f helm/values-local.yaml`
1. Exec into running pods and yarn start them up and get to work. Note: Be sure to run `yarn` or `npm install` while on the host filesystem and NOT inside the running container.
    * `kubectl exec -n appcket -it svc/marketing -- bash`
    * `kubectl exec -n appcket -it svc/api -- bash`
    * `kubectl exec -n appcket -it svc/app -- bash`
    * You can also now use VS Code Remote Containers to work on the volume mounted files directly in the container
        * Shift + ctrl + P -> Attach to Running Container -> k8s_app_app-* or k8s_ap_api-*

## After initial setup

After going through the steps above for the initial setup, you can run the start.sh script that will execute the commands you need after everytime you restart your computer.

1. `cd ./deployment`
1. `./environment/local/start.sh`

## Cleanup/Shutdown

1. helm delete appcket -n appcket