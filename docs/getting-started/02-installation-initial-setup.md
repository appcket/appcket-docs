---
id: installation-initial-setup
title: Installation and initial setup
---

Please ensure your local development machine meets the [Prerequisites for Appcket](./prerequisites).

## First time setup

Docker Compose is used in a limited capacity and gives the ability to easily run containers in local development mode instead of executing individual Docker commands.
You will start a local registry container that allows you to push and host images that Kubernetes needs to start services.
Using Kubernetes locally allows us to spin up services and create resources similar to production. Additionally, local Postgres, Redis and ClickHouse will run in a container started by Docker Compose.

The following steps need to be performed the first time on your local development machine.

### Clone the repo

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

### Add host entries

1. Hardcode the following host entries in your hosts file (on Windows it's `C:\Windows\System32\drivers\etc\hosts`, and on Linux it's usually `/etc/hosts`).
    ```
    127.0.0.1 {PROJECT_MACHINE_NAME}.test
    127.0.0.1 accounts.{PROJECT_MACHINE_NAME}.test
    127.0.0.1 app.{PROJECT_MACHINE_NAME}.test
    127.0.0.1 api.{PROJECT_MACHINE_NAME}.test
    127.0.0.1 redpanda.{PROJECT_MACHINE_NAME}.test
    127.0.0.1 sequin.{PROJECT_MACHINE_NAME}.test
    ```

### Run the Mise bootstrap task

1. A Mise bootstrap task is provided that will perform the main setup steps for a fresh appcket project.
    1. From the root of the project, run: `mise run bootstrap`
    1. Feel free to browse the `mise.toml` file to see all that the bootstrap process performs

:::note

Running the bootstrap script will take some time depending on your internet connection speed. **Also**, there is a Powershell command needed to run as admin at the end of the process to trust the certs.

:::

### Start Containers

1. Start containers by installing Appcket into the cluster via the Helm chart in the `deployment` folder.
    * `mise run start`
    * You will need to input your sudo password to create the bind mount directory
1. After a couple minutes (~5 minutes for main-outbox-watcher pod to pull the Sequin image), verify the pods in the appcket and redpanda namespaces are running as expected
    * `kubectl get pod -n appcket`
    * `kubectl get pod -n redpanda`
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
        * Marketing: `https://{PROJECT_MACHINE_NAME}.test`
        * API: `https://api.{PROJECT_MACHINE_NAME}.test`
        * App: `https://app.{PROJECT_MACHINE_NAME}.test`
            * Login with any user below and `abc123` as the password
                * `art` (Manager role)
                * `ryan` (Captain role)
                * `kel` (Teammate role)
                * `he` (Teammate role)
                * `lloyd@appcket.org` (Spectator role)
            * e.g., the Spectator role is view-only, so the `lloyd` user can view but cannot edit or create anything.
        * Accounts: `https://accounts.{PROJECT_MACHINE_NAME}.test`
            * The default admin account username and password are `admin/admin`
1. See events stream across the system
    * Sequin console UI: https://sequin.appcket.test/
        * Username and password in `deployment\environment\local\helm\appcket\sequin.yaml`
    * Redpanda console UI: https://redpanda.appcket.test/

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
