---
id: prerequisites
title: Prerequisites
---

These instructions are intended to be performed using Windows, but as long as equivalent items are installed it should work fine on Linux or MacOS.

On Windows, it is mandatory that you use WSL2 and the Ubuntu distro for all development work. In other words, do not save your files on the Windows C:\ drive. Your files (git repos) should be inside of the Ubuntu WSL filesystem at `\wsl$\Ubuntu\home\{YourUsername}`. See [this blog post](https://www.docker.com/blog/docker-desktop-wsl-2-best-practices/) for reasoning and best practices.

Install Windows software using [Chocolatey](https://chocolatey.org/) or similar. Install Ubuntu software inside WSL Ubuntu using the normal apt process.

### Hardware

1. A newish CPU
1. At least 16 GB ram

### Windows software

1. WSL2 with Ubuntu 20.04
1. Windows Terminal
1. [Docker for Windows](https://docs.docker.com/docker-for-windows/install/) - latest
    * use WSL2 based Engine, instead of the Hyper-V backend
    * Enable Kubernetes
1. [Docker Compose](https://docs.docker.com/compose/install/)
1. [Mkcert](https://github.com/FiloSottile/mkcert)
    * Run Powershell as Administrator and run the command:
    * `choco install mkcert`
1. [Visual Studio Code](https://code.visualstudio.com/) - latest
    * [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
    * [Eslint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    * [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### WSL/Ubuntu software

1. [NodeJS via nvm](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) - 24
1. [pnpm](https://pnpm.io/installation) -latest
1. [Istio](https://istio.io/) - 1.14+
    * Follow the [download and installation instructions](https://istio.io/latest/docs/setup/getting-started/#download) on istio.io
    * Be sure to add the following line to your `~/.profile`
        * `export PATH=~/path/to/istio/bin:$PATH`
1. [Helm](https://helm.sh/docs/intro/install/#from-apt-debianubuntu) - 3+
1. [Mkcert](https://github.com/FiloSottile/mkcert)
    * `wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64`
    * `sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert`
    * `sudo chmod +x /usr/local/bin/mkcert`
1. [psql](https://www.postgresql.org/docs/current/app-psql.html)
    * `sudo apt update`
    * `sudo apt install -y postgresql-client`

### Setup Mkcert in Windows and WSL
You will notice that you installed Mkcert in Windows with Chocolatey and also in Ubuntu WSL with apt. This is so we can create certs using the Linux version of mkcert and also those certs will be valid in Windows apps like Chrome for local development.

1. Run "mkcert -install" for certificates to be trusted automatically
    * In Windows Powershell run `mkcert.exe -install`
    * In a Windows Terminal WSL shell run `mkcert -install`
1. In Windows Powershell, find out where the mkcert directory is
    * `mkcert.exe -CAROOT`
1. In a Windows Terminal WSL shell, find out where the mkcert directory is
    * `mkcert -CAROOT`
1. Copy the rootCA files from Windows to the WSL mckert directory
    * ex: `sudo cp /mnt/c/Users/{YourUsername}/AppData/Local/mkcert/rootCA* /home/{YourUsername}/.local/share/mkcert`