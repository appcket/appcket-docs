---
id: prerequisites
title: Prerequisites
---

These instructions are written for Windows, but should work on Linux or macOS if equivalent software is installed.

On Windows, you must use WSL2 and the latest Ubuntu distro for development. Do not save your work on the Windows C: drive. Your git repositories should be stored inside the Ubuntu WSL filesystem, for example: `\\wsl.localhost\\Ubuntu-24.04\\home\\{YOUR_USERNAME}\\dev`.

Install Windows software with [Chocolatey](https://chocolatey.org/) or a similar package manager. Install Ubuntu packages inside WSL using the apt package manager.

### Hardware

1. A recent CPU
1. At least 16 GB RAM

### Windows software

1. [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) - "Ubuntu-24.04" as the distro
1. [Windows Terminal](https://learn.microsoft.com/en-us/windows/terminal/install)
1. [Visual Studio Code](https://code.visualstudio.com/) - latest
    * [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
    * [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    * [Prettier extension](https://marketplace.visualstudio.com/items?itemName=prettier.prettier-vscode)
    * [Kubernetes Tools extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools)
1. [Rancher Desktop for Windows](https://docs.rancherdesktop.io/getting-started/installation/#windows)
    * Rancher Desktop installs everything you need, like Docker, Docker Compose, kubectl, and Helm.
    * Preferences ➡️ Application ➡️ Behavior ➡️ select **Automatically start at login** and **Start in the background**
    * Preferences ➡️ WSL ➡️ select **Ubuntu-24.04** distro
    * Preferences ➡️ Container Engine ➡️ select **dockerd (moby)**
    * Preferences ➡️ Kubernetes ➡️ select **Enable Kubernetes**
        * For the Kubernetes version, choose the latest stable version
    * Create a registries.yaml file inside the rancher-desktop WSL instance
        * In a PowerShell terminal run:
        ```
        wsl.exe -d rancher-desktop -u root -- sh -c 'cat <<EOF > /etc/rancher/k3s/registries.yaml
        mirrors:
          "localhost:5000":
            endpoint:
              - "http://localhost:5000"
        EOF'
        ```
        * To verify the registries.yaml file was created, run `wsl.exe -d rancher-desktop -u root -- sh` from PowerShell to open a shell in the rancher-desktop WSL instance, then run `cat /etc/rancher/k3s/registries.yaml`.
        * **Restart Rancher Desktop for this change to take effect**

### WSL/Ubuntu software

1. [pnpm](https://pnpm.io/installation) - latest
1. [NodeJS recommended to install with pnpm env](https://pnpm.io/cli/env) - 24+
    * After installing node via pnpm env, need to install libatomic1: `sudo apt update && sudo apt install libatomic1`
1. [Istio](https://istio.io/) - 1.28+
    * Istio documentation is a little scattered, so we've summarized the commands you need below. For more information, see [Ambient mode download and installation instructions with Helm](https://istio.io/latest/docs/ambient/install/helm/) on istio.io.
    ```
    helm repo add istio https://istio-release.storage.googleapis.com/charts && helm repo update
    helm install istio-base istio/base -n istio-system --create-namespace
    kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.0/experimental-install.yaml
    helm install istiod istio/istiod --namespace istio-system --set profile=ambient \
        --set "pilot.env.PILOT_ENABLE_GATEWAY_API=true" \
        --set "pilot.env.PILOT_ENABLE_GATEWAY_API_DEPLOYMENT_CONTROLLER=true"
    # Rancher Desktop uses k3s, so you need to set the platform here (https://istio.io/latest/docs/ambient/install/platform-prerequisites/#k3s)
    helm install istio-cni istio/cni -n istio-system --set profile=ambient --set global.platform=k3s
    helm install ztunnel istio/ztunnel -n istio-system
    ```
1. Cert-Manager
    * When installing cert-manager from the Redpanda docs, I ran into an error: "container has runAsNonRoot and image will run as root". We are going to disable the security check and install cert-manager using the command below. ***Not for production***, but acceptable for a local dev environment.
    ```
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    helm install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.19.2 \
        --set crds.enabled=true \
        --set securityContext.runAsNonRoot=false \
        --set webhook.securityContext.runAsNonRoot=false \
        --set cainjector.securityContext.runAsNonRoot=false \
        --set startupapicheck.securityContext.runAsNonRoot=false
    ```
1. Redpanda
    * [Deploy Redpanda to your cluster](https://docs.redpanda.com/current/deploy/redpanda/kubernetes/local-guide/#deploy-redpanda-and-redpanda-console) by running the commands below. In the future if this changes, use the **Redpanda Operator** installation method and `redpanda` for the namespace.
    ```
    helm repo add redpanda https://charts.redpanda.com
    helm repo update
    helm upgrade --install redpanda-controller redpanda/operator \
    --namespace redpanda \
    --create-namespace \
    --version v25.3.1 \
    --set crds.enabled=true
    ```
    * **DO NOT** install the cluster or topic from the docs. We will do that step later automatically when running the bootstrap.sh script.
1. [psql](https://www.postgresql.org/docs/current/app-psql.html)
    * `sudo apt update && sudo apt install -y postgresql-client`