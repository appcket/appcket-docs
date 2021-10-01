---
id: troubleshooting
title: Troubleshooting
slug: /troubleshooting
---

## Determine the Reason for Pod Failure

* ` kubectl get pod marketing-85bbcc5c58-97wz5 --output=yaml -n appcket`

## Api/Accounts integration

### If receive error "can't read grant of undefined" or "wrong iss" when issuing a graphql command in Postman/Insomnia
Make sure all the items in the keycloak config are correct for each environment (realm-public-key, etc).
To get the api client public key, go to the Appcket Realm settings, click on Keys tab, and then click the Public Keys button in the RS256 row. A dialog will pop up that you can copy from.

Make sure the auth-server-url in Keycloak config matches the accounts server url (.localhost instead of .com) by setting the appropriate NODE_ENV variable: NODE_ENV=development or NODE_ENV=production, etc. otherwise you will get Access Denied, (wrong iss) error in grant-manager.js.

Put a breakpoint in validateToken() method of api/node_modules/keycloak-connect/middleware/auth-utils/grant-manager.js to step through the possible reasons why the token could be bad.

### CoreDNS

See the current running config

    kubectl get configmap -n kube-system coredns -o yaml

or

    kubectl describe cm coredns -n kube-system

This will allow you to see what the k8s coredns config is and let you troubleshoot any connectivity issues between the api and accounts services.

### SSL Errors or Unable to reach an app in the browser unexpectedly (ERR_CONNECTION_CLOSED)

The istio-ingressgateway pod and your application pods might need to be restarted:

    kubectl scale deployment istio-ingressgateway --replicas=0 -n istio-system
    kubectl scale deployment istio-ingressgateway --replicas=1 -n istio-system
    cd ./deployment
    ./environment/local/start.sh

See [this GH issue](https://github.com/istio/istio/issues/14942#issuecomment-816430434) for more info.

## Notes

### Postgres Database Notes

Make a backup of the keycloak (accounts) and api schemas

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