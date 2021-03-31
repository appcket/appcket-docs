---
id: troubleshooting
title: Troubleshooting
slug: /troubleshooting
---

## Helm

Create a helm package (where appcket-helm is a folder resulting from a `helm create` command)
* `helm package appcket-helm`

Test helm package
* `helm install appcket ./appcket-0.1.0.tgz -n appcket --dry-run --debug`

Install local helm package to the appcket namespace
* `helm install appcket ./appcket-0.1.0.tgz -n appcket -f helm/values-local.yaml`

Delete helm package
* `helm delete appcket -n appcket`

## Determine the Reason for Pod Failure

* ` kubectl get pod marketing-85bbcc5c58-97wz5 --output=yaml -n appcket`

## Notes

### Old resource manifest (non-helm, not needed) instructions

1. Start the accounts service (taken from <https://istio.io/docs/tasks/traffic-management/ingress/ingress-control>), make sure you are in the root of the deployment folder
    1. `kubectl apply -f ./environment/local/resource-manifests/accounts.yaml -n appcket`
1. Start other Kubernetes Resources: VirtualServices, Services, Deployments
    * `kubectl apply -f ./environment/local/resource-manifests/marketing.yaml -f ./environment/local/resource-manifests/accounts.yaml -f ./environment/local/resource-manifests/api.yaml -f ./environment/local/resource-manifests/app.yaml -n appcket`
1. Deprecated: This is for TLS termination at the gateway, which won't work with Keycloak since we must access it from the api service as https and need to TLS all the way to the Keycloak service itself.
    * Create two Istio secret credentials (one for marketing site, and one for wildcard subdomain) for tls cert/key (be sure you are in the correct directory of cert and key values in this command, `cd ./deployment/environment/local/certs`) [https://istio.io/docs/tasks/traffic-management/ingress/secure-ingress-sds/](https://istio.io/docs/tasks/traffic-management/ingress/secure-ingress-sds/). NOTE: must create these secrets in the istio-system namespace! As of October 2020, Istio does not allow Gateways to access secrets in other namespaces. See [comment in open Github issue](https://github.com/istio/istio/issues/14598#issuecomment-628755375).
    * `kubectl create -n istio-system secret generic appcket-credential --from-file=key=appcket.localhost.key --from-file=cert=appcket.localhost.crt`
    * `kubectl create -n istio-system secret generic star-appcket-credential --from-file=key=star.appcket.localhost.key --from-file=cert=star.appcket.localhost.crt`
1. Start Istio Gateway resource
    * `kubectl apply -f ./environment/local/resource-manifests/appcket-gateway.yaml -n appcket`

## Vault

[Vault running in Docker with Consul storage backend](https://github.com/testdrivenio/vault-consul-docker/) and [blog post details](https://testdriven.io/blog/managing-secrets-with-vault-and-consul/)

In the local environment, I tried getting Vault to use the accounts service running in k8s as an OIDC authentication provider, but was unable to get Vault to make a connection to accounts via https (got a connection refused error), can revisit this later, but need to also try in production with valid certificates.

See [this blog post](https://number1.co.za/using-keycloak-as-the-identifyprovider-to-login-to-hashicorp-vault/) for step by step instructions on how to set this up.