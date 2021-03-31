---
id: prerequisites
title: Prerequisites
---

On Windows, it is mandatory that you use WSL2 and the Ubuntu distro for all development work. In other words, do not save your files on the Windows C:\ drive. Your files (git repos) should be inside of the Ubuntu WSL filesystem at \\wsl$\Ubuntu\home\{YourUsername}. See [this blog post](https://www.docker.com/blog/docker-desktop-wsl-2-best-practices/) for reasoning and best practices.

This README is intended to be performed using Windows, but as long as the following equivalent items are installed it should work fine on Linux or MacOS.

Install Windows software using [Chocolatey](https://chocolatey.org/) or similar. Install Ubuntu software inside WSL Ubuntu using the normal apt-get process.

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
1. [Istio](https://istio.io/) - 1.8+
1. [Visual Studio Code](https://code.visualstudio.com/) - latest
    * [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
    * [Eslint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    * [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### WSL/Ubuntu software

1. [NodeJS - 14](https://github.com/nodesource/distributions/blob/master/README.md#deb)
1. [Yarn - 1.x](https://classic.yarnpkg.com/en/docs/install#windows-stable)
1. [Helm - 3.x](https://helm.sh/docs/intro/install/)