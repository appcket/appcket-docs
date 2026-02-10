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

1. [Mise](https://mise.jdx.dev/getting-started.html#installing-mise-cli) - install using the Debian/Ubuntu (apt) commands
    * Mise is a dev env setup tool that will install all the prerequisite software needed for local development. The following is just a list of tools that will get installed when you run the mise bootstrap task on the next page.
        * pnpm
        * NodeJS
        * psql
        * helm
        * Istio via helm
        * Cert-Manager via helm
        * Redpanda via helm