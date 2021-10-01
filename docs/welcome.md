---
id: welcome
title: Welcome
slug: /
---

### What is Appcket?

You have an idea for an app you want to build. Appcket is like strapping your **app** idea to a ro**cket** :rocket:. It's a starter-kit that provides teams and developers like yourself with a solid base on which to build their next great web app and get up and running *quickly*.

We believe starting, developing, testing and deploying a web application these days shouldn't be complex even when using Kubernetes. The "boring" part of gluing everything together and making sure all the details are covered has been done for you so you can focus on your competitive advantage and what makes your idea unique.

### What's included

* Single page app using [React](https://reactjs.org/) + Typescript
    * [MUI](https://mui.com/) used for the UI Component Library
* GraphQL API using [NestJs](https://nestjs.com/) & [Prisma](https://www.prisma.io/) + Typescript
* Authentication and Authorization using [Keycloak](https://www.keycloak.org/)
    * User accounts and profiles
    * User registration
    * Forgot password
* [Postgres](https://www.postgresql.org/) Database
* Local development using [Docker Desktop](https://docs.docker.com/desktop/) and [Kubernetes](https://kubernetes.io/)

The [main appcket repo](https://github.com/appcket/appcket-org) contains everything you need to get started like a React-based client app that talks to a NestJS GraphQL API running in Kubernetes - all backed by a Postgres database.

It even comes with a fully working Keycloak instance. A secure and full-featured user accounts experience awaits you and your users. Don't worry about integrating a custom Authentication and Authorization system because Appcket already does this for you!

If this sounds exciting, read on in the [Getting Started](../getting-started/prerequisites) section!

### What it's not

Appcket is not for beginners just starting out learning how to build a web application. It's also not for developers or teams who want to deploy to the cheapest web host they can find.

It's mainly for those who want to learn about or use Kubernetes and microservices in a cloud provider like AWS EKS, DigitalOcean Kubernetes, and the like.

### Simple Demo

![Appcket Demo](/img/appcket-demo.gif)