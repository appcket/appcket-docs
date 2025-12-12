---
id: installation-initial-setup
title: Installation and initial setup
---

Please ensure your local development machine meets the [Prerequisites for Appcket](./prerequisites).

## First time setup

Docker Compose is used in a limited capacity and gives the ability to easily run containers in local development mode instead of executing individual Docker commands.
You will be running a local registry container that allows you to push and host images that Kubernetes needs in order to start services.
Using Kubernetes locally allows us to spin up services and create resources similar to production. Additionally, your local Postgres database will run in a container started by Docker Compose.

The following steps need to be performed the first time on your local development machine.

### Set up directories and bind mount

:::note

When running any commands below with `{PROJECT_MACHINE_NAME}`, change this to your own project's name. `appcket-org` is used in this case.

:::

1. Using Windows Terminal in your Ubuntu WSL distribution, create a ~/dev directory if one does not already exist
    ```
    mkdir -p ~/dev/{PROJECT_MACHINE_NAME}
    cd ~/dev/{PROJECT_MACHINE_NAME}
    ```
1. Fork and clone the appcket-org repo into `~/dev/{PROJECT_MACHINE_NAME}`
    ```
    git clone https://github.com/appcket/appcket-org.git -b main main
    cd main
    ```
1. Update the Istio control plane (istiod) to handle TLSRoute
    ```
    helm upgrade istiod istio/istiod -n istio-system -f ./deployment/helm/values-local-istio.yaml
    ```
1. In order to be able to mount your files into running Kubernetes containers, you will need to create a bind mount from your Ubuntu home dev directory to under /mnt/wsl on your host. Using Windows Terminal in your Ubuntu WSL distribution, run:
    * `mkdir -p /mnt/wsl/rancher-desktop-bind-mounts/dev`
    * `sudo mount --bind ~/dev /mnt/wsl/rancher-desktop-bind-mounts/dev`
        * You need to repeat the above steps each time you restart your computer. To simplify this, use the `start.sh` script in `deployment/environment/local` anytime you want to start your local environment.
    * Update the `deployment/helm/values-local.yaml` in the `app.hostPath`, `api.hostPath`, and `marketing.hostPath` sections to point to the correct mount paths on your WSL instance.
    * It should be something similar to: `/mnt/wsl/rancher-desktop-bind-mounts/dev/{PROJECT_MACHINE_NAME}/{GIT_BRANCH_NAME}/marketing`.

### Add host entries

1. Hardcode the following host entries in your hosts file (on Windows it's `C:\Windows\System32\drivers\etc\hosts`, and on Linux it's usually `/etc/hosts`).
    * `127.0.0.1 {PROJECT_MACHINE_NAME}.localhost accounts.{PROJECT_MACHINE_NAME}.localhost app.{PROJECT_MACHINE_NAME}.localhost api.{PROJECT_MACHINE_NAME}.localhost`

### Run the Bootstrap Script

1. A bootstrap.sh script is provided that will perform the main setup steps for a fresh appcket project.
    1. Edit the `deployment/environment/local/bootstrap.sh` file and change the values of the `PROJECT_MACHINE_NAME` and `PROJECT_HUMAN_NAME` variables.
    1. Then run the script from inside the deployment folder
        * `cd ~/dev/appcket-org/{GIT_BRANCH_NAME}/deployment/environment/local`
        * `chmod +x ./bootstrap.sh`
        * `./bootstrap.sh`

:::note

Running the bootstrap script will take some time depending on your internet connection speed.

:::

### Create Tables and Seed Data

MikroORM is used in the API to interact with the database. We also use the MikroORM CLI to migrate and seed the initial sample data for the application. Accounts (Keycloak) data was set up when you ran the bootstrap script.

1. `cd database` - if you are already inside the `deployment` folder; if not, `cd` to the `deployment` folder.
1. `pnpm install`
1. `pnpm schema-seed`
1. `pnpm post-seed`

### Start Containers

1. Start containers by installing Appcket into the cluster via the Helm chart in the `deployment` folder.
    * Change to the `./deployment/environment/local` folder
    * `chmod +x ./start.sh`
    * `./start.sh`
1. Exec into running pods, install dependencies, and start services. Be sure to run `pnpm install` to install dependencies before starting the applications.
    * `kubectl exec -n {PROJECT_MACHINE_NAME} -it svc/api -- bash`
    * `kubectl exec -n {PROJECT_MACHINE_NAME} -it svc/app -- bash`
    * `kubectl exec -n {PROJECT_MACHINE_NAME} -it svc/marketing -- bash`
        * Source code is mounted into the `/src` folder inside each container.
    * You can also now use VS Code Remote Containers to work on the volume mounted files directly in the container
        * Ctrl+Shift+P
        * Attach to Running Kubernetes Container
        * Select a container: `app-...` or `api-...`, etc.
    * Once you have an active shell in each container, run `pnpm install` to install dependencies. Then run `pnpm start:debug` for the API, and `pnpm start` for the app and the marketing site.
    * You can also select `Run -> Start Debugging (F5)` to run each app in VS Code.
    * The Keycloak/accounts server will start automatically (you need to give the accounts service a couple minutes to completely load).
    * Access these local containers in your browser
        * Marketing: `https://{PROJECT_MACHINE_NAME}.localhost`
        * API: `https://api.{PROJECT_MACHINE_NAME}.localhost`
        * App: `https://app.{PROJECT_MACHINE_NAME}.localhost`
            * Login with any username below and `abc123` as the password
                * `art` (Manager role)
                * `ryan` (Captain role)
                * `kel` (Teammate role)
                * `he` (Teammate role)
                * `lloyd` (Spectator role)
            * e.g., the Spectator role is view-only, so the `lloyd` user can view but cannot edit or create anything.
        * Accounts: `https://accounts.{PROJECT_MACHINE_NAME}.localhost`
            * The default admin account username and password are `admin/admin`

### Database Schema Changes


As you develop your application, you will need to update your data model.

```
TODO: Update this for MikroORM-specific steps.
```

:::note

Whenever you change any files in your api entities `api/src/**.entity.ts`, copy those changes to `deployment/database/entities` TODO: Automate keeping both schemas in sync when one changes.

:::

### Teardown/Delete Project (if necessary)

:::warning

Executing the following commands will delete your local database and any data you had for this project!

:::

1. `cd ./deployment/environment/local`
1. `docker compose -p {PROJECT_MACHINE_NAME} down`
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
    * `sudo umount /mnt/wsl/rancher-desktop-bind-mounts/dev/{PROJECT_MACHINE_NAME}`
    * `sudo rm -rf /mnt/wsl/rancher-desktop-bind-mounts/dev/{PROJECT_MACHINE_NAME}`
1. TODO: delete project-specific images from local registry (can manually delete unused images using Rancher Desktop GUI)
