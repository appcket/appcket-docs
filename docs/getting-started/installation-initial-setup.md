---
id: installation-initial-setup
title: Installation and initial setup
---

Please ensure your local development machine meets the [Prerequisites for Appcket](./prerequisites).

## First time setup

Docker Compose is used in a limited capacity and gives the ability to easily run containers in local development mode instead of executing individual Docker commands.
You will be running a local registry container that allows you to push and host images that k8s needs in order to start Services.
Using Kubernetes locally allows us to spin up services and create resources similar to production. Additionally, your local Postgres database will run in a container started by Docker Compose.

The following steps need to be performed the first time on your local development machine.

### Setup Directories and Mounts

:::note

When running any commands below with {PROJECT_MACHINE_NAME}, change this to your own project's name.

:::

1. Using Windows Terminal in your Ubuntu WSL distribution, create a ~/dev directory if one is not already created
    1. `mkdir ~/dev`
    1. `cd ~/dev`
1. Fork and clone the appcket-org repo into ~/dev/appcket
    1. `git clone https://github.com/appcket/appcket-org.git -b main {PROJECT_MACHINE_NAME}`
1. Using Windows Terminal, create a bind mount directory from your Ubuntu home `dev` directory to the Docker host mount path by:
    1. `sudo mkdir -p /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`
    1. `sudo mount --bind ~/dev/{PROJECT_MACHINE_NAME} /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`
        1. need to do the above steps every time you restart your computer :( but there is a handy start.sh script in deployment/environment/local you can use that does this plus some other local setup commands for you
    1. Use this path for the volume.hostPath.path value for mounting volumes in your k8s pods: `/run/desktop/mnt/host/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`. These paths are already set in the yaml resource-manifest files. This is just documented here as a note and something to be aware of.
    1. See this [github issue comment](https://github.com/docker/for-win/issues/7023#issuecomment-640142404) for more info

### Add hosts Entries

1. Hardcode the following host entries in your hosts file (on Windows it's @ C:\Windows\System32\drivers\etc\hosts and Linux is usually /etc/hosts)
    * `127.0.0.1 {PROJECT_MACHINE_NAME}.localhost accounts.{PROJECT_MACHINE_NAME}.localhost app.{PROJECT_MACHINE_NAME}.localhost api.{PROJECT_MACHINE_NAME}.localhost`

### Run the Bootstrap Script

1. A deployment/bootstrap.sh script is provided that will perform the main setup steps for a fresh appcket project.
    1. Edit the `deployment/bootstrap.sh` file and change the values of the `PROJECT_MACHINE_NAME` and `PROJECT_HUMAN_NAME` variables.
    1. Then run the script from inside the deployment folder
        * `cd ~/dev/{PROJECT_MACHINE_NAME}/deployment`
        * `chmod +x ./bootstrap.sh`
        * `./bootstrap.sh`

:::note

Running the bootstrap script will take some time depending on your internet connection speed.

:::

### Create Tables and Seed Data

MikroOrm is used in the api to interact with the database. We also use the MikroOrm CLI to migrate and seed the initial sample data for the application. Accounts (Keycloak) data was setup when you ran the bootstrap script.

1. `cd database` - if you are already inside the deployment folder
1. `yarn`
1. `yarn schema-seed`
1. `yarn post-seed`

### Start Containers

1. Start containers by installing Appcket to cluster via Helm Chart in deployment folder
    * `cd ../`
    * `helm package helm`
    * `helm install {PROJECT_MACHINE_NAME} ./{PROJECT_MACHINE_NAME}-0.1.0.tgz -n {PROJECT_MACHINE_NAME} -f helm/values-local.yaml --dry-run --debug`
    * `helm install {PROJECT_MACHINE_NAME} ./{PROJECT_MACHINE_NAME}-0.1.0.tgz -n {PROJECT_MACHINE_NAME} -f helm/values-local.yaml`
1. Exec into running pods and yarn start them up and get to work. Be sure to run `yarn` to install npm modules
    * `kubectl exec -n {PROJECT_MACHINE_NAME} -it svc/api -- bash`
    * `kubectl exec -n {PROJECT_MACHINE_NAME} -it svc/app -- bash`
    * `kubectl exec -n {PROJECT_MACHINE_NAME} -it svc/marketing -- bash`
        * Source code is mounted into the `/src` folder inside each container.
    * You can also now use VS Code Remote Containers to work on the volume mounted files directly in the container
        * Shift + ctrl + P -> Attach to Running Container -> k8s_app_app-... or k8s_api_api-...
    * Once you have an active shell in each container, you need to run `yarn` to install dependencies and then `yarn start:debug` to start the api in debug mode, `yarn start` for the app and `yarn start` for the marketing site. The Keycloak/accounts server will start automatically (you need to give the accounts service a couple minutes to completely load).
    * Access these local containers in your browser
        * Marketing: https://{PROJECT_MACHINE_NAME}.localhost
        * API: https://api.{PROJECT_MACHINE_NAME}.localhost
        * App: https://app.{PROJECT_MACHINE_NAME}.localhost
            * Login with any username below and `abc123` as the password
                * `art` (Manager role)
                * `ryan` (Captain role)
                * `kel` (Teammate role)
                * `he` (Teammate role)
                * `lloyd` (Spectator role)
            * ex: the Spectator role is view-only, so the lloyd user will only be able to see but can't edit or create anything
        * Accounts: https://accounts.{PROJECT_MACHINE_NAME}.localhost
            * The default admin account username and password is `admin/admin`

### After Initial Setup

After going through the steps above for the initial setup, you can run the start.sh script that will execute the commands you need after everytime you restart your computer.

1. `sudo mkdir -p /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`
1. `sudo mount --bind ~/dev/{PROJECT_MACHINE_NAME} /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`
1. `cd ./deployment`
1. `chmod +x ./start.sh`
1. `./environment/local/start.sh`

### Database Schema Changes

TODO: Change this for use with Mikro-ORM specific steps.

As you develop your application, you will need to update your data model. This is done by modfifying the `deployment/database/schema.prisma` file and then generating/seeding those changes.

1. `./node_modules/.bin/dotenv -e .env.local -- ./node_modules/.bin/prisma generate`
1. `./node_modules/.bin/dotenv -e .env.local -- ./node_modules/.bin/prisma migrate dev`
1. `./node_modules/.bin/dotenv -e .env.local -- ./node_modules/.bin/prisma db seed`

:::note

Whenever you change deployment/database/prisma/schema.prisma, you should copy/paste into api/prisma/schema.prisma and generate there too so the api will also have the latest schema. TODO: Need to find a way to automate this process to keep both in sync where changing one updates the other.

:::

### Teardown/Delete Project (if necessary)

:::warning

Executing the following commands will delete your local database and any data you had for this project!

:::

1. `cd ./deployment/environment/local`
1. `docker-compose -p {PROJECT_MACHINE_NAME} down`
1. `helm delete {PROJECT_MACHINE_NAME} -n {PROJECT_MACHINE_NAME}`
1. Delete Kubernetes secrets
    * `kubectl delete secret database-secret -n {PROJECT_MACHINE_NAME}`
    * `kubectl delete secret accounts-secret -n {PROJECT_MACHINE_NAME}`
    * `kubectl delete secret api-keycloak-client-secret -n {PROJECT_MACHINE_NAME}`
1. Delete Kubernetes project namespace
    * `kubectl delete namespace {PROJECT_MACHINE_NAME}`
1. Delete Docker database volume
    * `docker volume rm {PROJECT_MACHINE_NAME}-database`
1. Unmount project directory
    * `sudo umount /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`
    * `sudo rm -rf /mnt/wsl/docker-desktop-bind-mounts/Ubuntu/dev/{PROJECT_MACHINE_NAME}`
1. TODO: delete project-specific images from local registry (can manually delete unused images using Docker Desktop GUI)
