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

## Api/Accounts integration

### If receive error "can't read grant of undefined" or "wrong iss" when issuing a graphql command in Postman/Insomnia
Make sure all the items in the keycloak config are correct for each environment (realm-public-key, etc).
To get the api client public key, go to the Appcket Realm settings, click on Keys tab, and then click the Public Keys button in the RS256 row. A dialog will pop up that you can copy from.

Make sure the auth-server-url in Keycloak config matches the accounts server url (.localhost instead of .com) by setting the appropriate NODE_ENV variable: NODE_ENV=development or NODE_ENV=production, etc. otherwise you will get Access Denied, (wrong iss) error in grant-manager.js.

Put a breakpoint in validateToken() method of api/node_modules/keycloak-connect/middleware/auth-utils/grant-manager.js to step through the possible reasons why the token could be bad.

## CoreDNS Issues

See the current running config

    kubectl get configmap -n kube-system coredns -o yaml

or

    kubectl describe cm coredns -n kube-system

This will allow you to see what the k8s coredns config is and let you troubleshoot any connectivity issues between the api and accounts services.

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

#### Postgres Database Notes

Make a backup of the public (accounts) and api schemas

exec into the database container and run commands:

    docker exec -it appcket_database_1 bash
    cd /tmp
    pg_dump --verbose --host=localhost --port=5432 --username=appcketuser --format=c -n "appcket" -n "keycloak" appcket > appcket_keycloak.backup

To get a plaintext dump run

appcket_dump.sql

        pg_dump --verbose --host=localhost --port=5432 --username=appcketuser --inserts -n "appcket" appcket > appcket_dump.sql

keycloak_dump.sql

        pg_dump --verbose --host=localhost --port=5432 --username=appcketuser --inserts -n "keycloak" appcket > keycloak_dump.sql

The backup should now be on your host filesystem in deployment/environment/local/api_public_dump.backup

If you need to restore a .backup file for postgres: `pg_restore -h localhost -p 5432 -U appcketuser -d appcket api_public_dump.backup`

### SSL Errors or Unable to reach an app in the browser unexpectedly (ERR_CONNECTION_CLOSED)

The istio-ingressgateway pod and your application pods might need to be restarted:

    kubectl scale deployment istio-ingressgateway --replicas=0 -n istio-system
    kubectl scale deployment istio-ingressgateway --replicas=1 -n istio-system
    cd ./deployment
    ./environment/local/start.sh

See [this GH issue](https://github.com/istio/istio/issues/14942#issuecomment-816430434) for more info.
