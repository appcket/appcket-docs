---
id: installation-initial-setup
title: Installation and initial setup
---

Please ensure your local development machine meets the [Prerequisites for Appcket](./prerequisites).

## First time setup

Docker Compose is used in a limited capacity and gives the ability to easily run containers in local development mode instead of executing individual Docker commands.
You will be running a local registry container that allows you to push and host images that k8s needs in order to start Services.
Using Kubernetes locally allows us to spin up services and create resources similar to production. Additionally, your local Postgres database will run in a container started by Docker Compose.

The following is needed to run everything the first time on your local development machine.

### Setup directories, mounts and certs for localhost https development

1. Using Windows Terminal, create a ~/dev/appcket directory if one is not already created
    1. `mkdir /home/{YourUsername}/dev/appcket`
1. Using Windows Terminal, create a bind mount directory from your Ubuntu home `dev` directory to the Docker host mount path by:
    1. `sudo mkdir -p /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/appcket`
    1. `sudo mount --bind /home/{YourUsername}/dev/appcket /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/appcket`
        1. need to do the above steps every time you restart your computer :( but there is a handy start.sh script in deployment/environment/local you can use that does this plus some other local setup commands for you
    1. Use this path for the volume.hostPath.path value for mounting volumes in your k8s pods: `/run/desktop/mnt/host/wsl/docker-desktop-bind-mounts/Ubuntu/dev`. These paths are already set in the yaml resource-manifest files. This is just documented here as a note and something to be aware of.
    1. See this [github issue comment](https://github.com/docker/for-win/issues/7023#issuecomment-640142404) for more info
1. Create certs for local https development
    * `cd ~/dev/appcket/deployment/environment/local/certs`
    * `mkcert.exe appcket.localhost`
    * `mkcert.exe *.appcket.localhost`
    * `mkcert.exe accounts.appcket.localhost`
1. Copy the `accounts.appcket.localhost.key `and `accounts.appcket.localhost.crt` files to the `accounts` folder and then rename them as `tls.key` and `tls.crt`.
    1. These files get copied to the container on image build. This is needed to run the accounts service (Keycloak) with TLS non-terminated at the Istio gateway. We need the accounts service to run internally with tls enabled.
1. Copy the `rootCA.crt`, `star.appcket.localhost.key`, `star.appcket.localhost.crt`, `accounts.tls.crt` and `accounts.tls.key` files to the `api/certs` folder so the api can trust the accounts self signed cert when it makes https calls to accounts to verify a token or check permissions.
1. Copy `accounts.tls.crt` and `accounts.tls.key` to `api/certs`
1. Copy `star.appcket.localhost.key`, `star.appcket.localhost.crt` (rename them to `tls.crt` and `tls.key`) to `app/certs` so the app can run in https mode.
1. Copy `appcket.localhost.key`, `appcket.localhost.crt` (rename them to `tls.crt` and `tls.key`) to `marketing/certs` so the marketing site can run in https mode.

### Docker and k8s Setup

1. Create a persistent named volume for local dockerized Postgres to store data on the host
    * `docker volume create --name appcket-database -d local`
    * This is used in the deployment/environment/local/docker-compose.yml file
1. Modify docker-compose.yml file to change the username and password if desired
1. Start registry and database containers
    * `cd deployment/environment/local`
    * `docker-compose -p appcket up -d`
1. Build, tag and push main images
    * `cd ../..`
    * `./build.sh -e local`
1. Hardcode the following host entries in your hosts file (on Windows it's @ C:\Windows\System32\drivers\etc\hosts and Linux is usually /etc/hosts)
    * `127.0.0.1 appcket.localhost accounts.appcket.localhost app.appcket.localhost api.appcket.localhost`
1. Create `appcket` database using DBeaver or similar tool. You should be able to connect to the database with localhost:5432 and the username/password from the docker-compose.yml file. (TODO: script this in environment/local/initial-db-setup.sql).
1. The "appcket" and "keycloak" schemas will be created after running the initial SQL scripts below
    1. Enable the uuid-ossp extension so UUIDs can be created on INSERT of new rows by adding the following SQL underneath the `CREATE schema appcket;` line in `deployment/environment/local/appcket_dump.sql`

            SET search_path TO appcket;
            DROP EXTENSION IF EXISTS "uuid-ossp";
            CREATE EXTENSION "uuid-ossp" SCHEMA appcket;

    1. Import the appcket inital data by running the `deployment/environment/local/appcket_dump.sql` script
    1. Import the keycloak inital data by running the `deployment/environment/local/keycloak_dump.sql` script
1. Create the Kubernetes namespace the services will use
    * `kubectl create namespace appcket`
1. Secret management is done using [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/#use-case-pods-with-prod-test-credentials) that get consumed by pods as environment variables
    1. Create Kubernetes secrets in the appcket namespace for database credentials that match the docker-compose.yml values
        * `kubectl create secret generic database-secret --from-literal=user=appcketuser --from-literal=password=Ch@ng3To@StrongP@ssw0rd -n appcket`
    1. Create Kubernetes secrets for Keycloak admin credentials (change the actual password to something strong!)
        * `kubectl create secret generic accounts-secret --from-literal=adminuser=admin --from-literal=adminpassword=Ch@ng3To@StrongP@ssw0rd -n appcket`
    1. There is one more secret you need to create, see the "Setup Appcket Realm in Keycloak section" below.
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
1. Start containers by installing Appcket to cluster via Helm Chart in deployment folder
    * `cd deployment/helm`
    * `helm package helm`
    * `helm install appcket ./appcket-0.1.0.tgz -n appcket -f helm/values-local.yaml --dry-run --debug`
    * `helm install appcket ./appcket-0.1.0.tgz -n appcket -f helm/values-local.yaml`
1. Exec into running pods and yarn start them up and get to work. Note: Be sure to run `yarn` or `npm install` while on the host filesystem and NOT inside the running container.
    * `kubectl exec -n appcket -it svc/marketing -- bash`
    * `kubectl exec -n appcket -it svc/api -- bash`
    * `kubectl exec -n appcket -it svc/app -- bash`
    * You can also now use VS Code Remote Containers to work on the volume mounted files directly in the container
        * Shift + ctrl + P -> Attach to Running Container -> k8s_app_app-* or k8s_app_api-*

### Setup Appcket Realm in Keycloak

1. Login to the accounts admin: [https://accounts.appcket.localhost/auth/admin/](https://accounts.appcket.localhost/auth/admin/)
1. Hover over the Master realm name in the top left, and select Add Realm
1. Import the Appcket realm starter data by clicking Select File
1. Import the `deployment/environment/local/realm-export.json` file and click Create
1. Create a Kubernetes secret for the Keycloak api client secret (You need to perform this step once you have your keycloak instance running, otherwise the api container will not start properly). Change the actual clientsecret value to the value of your api client secret found in the Keycloak admin ui at: Clients -> appcket_api -> Credentials -> Client Id and Secret -> Regenerate Secret)

        kubectl create secret generic api-keycloak-client-secret --from-literal=clientsecret=Your-Api-Client-Secret-From-Keycloak -n appcket

## After initial setup

After going through the steps above for the initial setup, you can run the start.sh script that will execute the commands you need after everytime you restart your computer.

1. `cd ./deployment`
1. `sudo mkdir -p /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/appcket`
1. `./environment/local/start.sh`

## Cleanup/Shutdown

1. helm delete appcket -n appcket

## Accounts (Keycloak) Admin Setup

It is recommended to automate the following steps by performing the above setup process. Only perform the below steps if you want to setup a new Keycloak realm from scratch.
You can either setup the Realm, Roles, Permissions, etc. manually using the instructions below, or you can import the deployment/environment/local/realm-export.json file above to get started faster. Just login to Keycloak as the admin and go to Add Realm and click the import button to select the file.

Create your users as needed.

Login to local Keycloak instance as the admin user, https://accounts.appcket.localhost

Create a new realm: appcket

In Realm Settings -> General, set the Frontend URL to the kubernetes pod name and port: https://accounts.appcket.localhost/auth
This is needed so the issuer is not invalid when checking the Bearer token received by the front and app during the check entitlements POST request process on the api side. See https://issues.redhat.com/browse/KEYCLOAK-6073.

Create two clients in keycloak admin area under the realm you just created

appcket_app

    Access Type = public
    Root URL = http://app.appcket.localhost
    Valid Redirect URLS = http://app.appcket.localhost/*, https://appcket.localhost
    Base URL = /
    Web Origins = http://app.appcket.localhost
    Advanced Settings
        - Acess token lifespan, 8 hours
    Authentication Flow Overrides: (???)
        - Browser Flow -> browser
        - Direct Grant Flow -> direct grant

appcket_api

    Access Type = confidential
    Authorization enabled = On

Get the appcket_api Client Secret (Appcket realm, appcket_api client, Credentials tab) and add it as the KEYCLOAK_CLIENT_SECRET env var in the api.yaml Istio resource manifest

Get the appcket_api Client Public Key (go to the appcket Realm settings, click on Keys tab, and then click the Public Keys button in the RS256 row. A dialog will pop up that you can copy from) and add it as the KEYCLOAK_CLIENT_PUBLIC_KEY env var in the api.yaml Istio resource manifest. Make sure this value is set in the keycloak config for the 'realm-public-key' value.

### Verify Audience

For a higher level of security on your Keycloak instance, you will want to verify the audience when validating a token on the appcket_api side. To do this, make sure `verify-token-audience: true` in your appcket_api keycloak config setup in app.module.ts.

Then, create a new Protocol Mapper in the appcket_app client as described below.

    1. In the appcket_app client, click on Mappers tab and Create button
    1. Name: Audience for appcket_app
    1. Type: Audience
    1. Included Client Audience: appcket_api <--- important, make sure to select the api client and not app here
    1. Add to access token: On

See Keycloak documentation for more information: https://www.keycloak.org/docs/latest/server_admin/#_audience_hardcoded

### Setting up roles and permissions for use in Appcket based system

Precondition: have a client created for each microservice needed for your application, ie: appcket_api. All the authorization/permissions will be applied per service (client in keycloak terminology) since each microservice has different authorization needs.

Have users already created (in the new realm you previously created) that you can add to various roles.

#### Add Roles

    1. Login to keycloak admin console
    1. Select the desired realm
    1. Go to Roles
    1. Add roles as needed (User, Customer, Employee, Manager, Captain, Teammate, Spectator etc)
    1. Set Permissions to Enabled
    1. Add users to role(s) as needed

#### Add Resources

    1. Add resources that map to your application needs:
        * Resource name: Task (for multi-word resources, capitalize camel case, no spaces: "MyResource" instead of "My Resource")

    You can use the admin console (GUI) to add resources, or POST to the Protection API* `resource_set` endpoint /auth/realms/${realm_name}/authz/protection/resource_set
    See https://www.keycloak.org/docs/latest/authorization_services/#creating-a-resource for more information.

    * You will need a valid [Protection API Token - PAT](https://www.keycloak.org/docs/latest/authorization_services/#_service_protection_whatis_obtain_pat) in order to use the Protection API.

    Use Postman or Insomnia client to interact with REST Protection API

#### Add Authorization Scopes

    Protection API:
    PUT endpoint https://accounts.appcket.localhost/auth/realms/${realm_name}/authz/protection/resource_set/{resource_id}
    JSON Body:
    {
        "_id": "Task",
        "name":"Task",
        "resource_scopes": [
            "task:read",
            "task:create",
            "task:update",
            "task:delete"
        ]
    }

    Admin Console - GUI
    1. Navigate to the desired service client (api for example) from precondition above and click on Authorization tab
    1. Click Authorization Scopes tab
    1. Add new auth scopes that your application needs (usually these are just CRUD-type actions), ie: project:read, project:create, project:update
        * Informational: associated permissions for these scopes (created in step below) would be as follows: Read Project Permission, Create Project Permission, Edit Project Permission
        * As a matter of preference and choosing a standard, use camelCase resource names (myResource instead of my_resource)
        * i.e.
            task:read
            task:create
            task:update
            task:delete
            team:read
            team:create
            team:update
            team:delete
            organization:read
            organization:create
            organization:update
            organization:delete

#### Associate Resources with Authorization Scopes

    Admin Console - GUI
    1. Click back into each resource, and add the associated scopes. ex: MyResource will have the following scopes: MyResource:create, MyResource:update, MyResource:read, MyResource:delete

#### Add Policies

    1. Click Policies tab
    1. Create new "role" based policies that map to roles, ie:
        - "Role" Policy -> "user" role
        - Manager Policy -> Manager role
        - Captain Policy -> Captain role
        - etc.
    1. Name: Captain Role Policy
    1. Required: unchecked
    1. Realm Role: select associated role
    1. Clients: don't need to set
    1. Logic: Positive

#### Permissions

This is where it all comes together.

    1. Click Permissions tab
    1. Create "scope" based permissions
        * Name: Create Team Permission
        * Description: don't need to set, since the name implies what the permission is for
        * Resource: select the applicable resource created from above: Team
        * Scopes: select the applicable scope(s) created from above: team:create
        * Apply policy: add all the the policies (roles) to which this permission should apply: Admin, User, Employee, Customer, Manager, Captain etc.
        * Decision strategy: Affirmative

    Organization Read Permission
    Organization Create Permission
    Organization Update Permission
    Organization Delete Permission

    Team Read Permission
    Team Create Permission
    Team Update Permission
    Team Delete Permission

    Task Read Permission
    Task Create Permission
    Task Update Permission
    Task Delete Permission

#### Test permission in Evaluate tab

    Use the Evaluate tab to test permissions against certain roles

#### Get a Bearer Token to test api endpoints

Setup environment variables in Insomnia and POST to the openid-connect token endpoint for the accounts server

    curl --request POST \
    --url https://accounts.appcket.localhost/auth/realms/appcket/protocol/openid-connect/token \
    --header 'content-type: application/x-www-form-urlencoded' \
    --data client_id=appcket_api \
    --data grant_type=password \
    --data client_secret=clientsecretid \
    --data scope=openid \
    --data username=yourusername \
    --data password=yourpasswordforusername
