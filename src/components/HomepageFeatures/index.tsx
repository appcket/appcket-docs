import type {ReactNode} from 'react';
import styles from './styles.module.css';

export default function HomepageFeatures(): ReactNode {
  return (
    <section>
      <div className="container">
        <div className={styles.row}>
          <h2>What is Appcket?</h2>
          <p>You have an idea for an app you want to build. Appcket is like strapping your app idea to a rocket 🚀. It's a starter-kit that provides teams and developers like yourself with a solid base on which to build their next great web app and get up and running quickly.</p>

          <p>
          We believe starting, developing, testing and deploying a web application these days shouldn't be complex even when using Kubernetes. The "boring" part of gluing everything together and making sure all the details are covered has been done for you so you can focus on your competitive advantage and what makes your idea unique.</p>
        </div>

        <div className={styles.row}>
          <h2>Simple Demo</h2>
          <img src="/img/appcket-demo.gif" alt="Appcket Demo" />
        </div>

        <div className={styles.row}>
          <h2>What's included?</h2>
            <div>
            <ul>
              <li>
                Modern marketing site using <a href="https://astro.build/" target="_blank" rel="noopener noreferrer">Astro</a>
              </li>
              <li>
                Single page app using <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">React</a> + Typescript
                <ul>
                  <li>
                    <a href="https://mui.com/" target="_blank" rel="noopener noreferrer">MUI</a> used for the UI Component Library
                  </li>
                </ul>
              </li>
              <li>
                GraphQL API using <a href="https://nestjs.com/" target="_blank" rel="noopener noreferrer">NestJs</a> &amp;  <a href="https://mikro-orm.io/" target="_blank" rel="noopener noreferrer">MikroOrm</a> + Typescript
              </li>
              <li>
                Authentication and Authorization using <a href="https://www.keycloak.org/" target="_blank" rel="noopener noreferrer">Keycloak</a>
                <ul>
                  <li>User accounts and profiles</li>
                  <li>User registration</li><li>Forgot password</li>
                </ul>
              </li>
              <li><a href="https://www.postgresql.org/" target="_blank" rel="noopener noreferrer">Postgres</a> Database</li>
              <li>
                Local development using <a href="https://docs.docker.com/desktop/" target="_blank" rel="noopener noreferrer">Docker Desktop</a> and <a href="https://kubernetes.io/" target="_blank" rel="noopener noreferrer">Kubernetes</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.row}>
          <p>The <a href="https://github.com/appcket/appcket-org" target="_blank" rel="noopener noreferrer">main appcket repo</a> contains everything you need to get started like a React-based client app that talks to a NestJS GraphQL API running in Kubernetes - all backed by a Postgres database.</p>

          <p>It even comes with a fully working Keycloak instance. A secure and full-featured user accounts experience awaits you and your users. Don't worry about integrating a custom Authentication and Authorization system because Appcket already does this for you!</p>

          <p>If this sounds exciting, read on in the <a href="/getting-started/prerequisites">Getting Started</a> section!</p>
        </div>

        <div className={styles.row}>
          <h2>What it's not</h2>
          <p>Appcket is not for beginners just starting out learning how to build a web application. It's also not for developers or teams who want to deploy to the cheapest web host they can find.</p>

          <p>
          It's mainly for those who want to learn about or use Kubernetes and microservices in a cloud provider like AWS EKS, DigitalOcean Kubernetes, and the like.</p>
        </div>
      </div>
    </section>
  );
}
