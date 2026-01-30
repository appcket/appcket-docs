---
id: architecture
title: Architecture and System Design
slug: /architecture
---

### 🖼️ Appcket System Design Diagram

Based on the [C4 model](https://c4model.com/).

![Appcket System Design](/img/appcket-system-design.svg)

### ❇️ System Design 2.0

Appcket is a shift from System Design 1.0 where applications are built as a series of isolated request-response silos to a unified, event-driven ecosystem. In this architecture, MainService (GraphQL API) doesn't just manage state; it broadcasts intent. By leveraging the Transactional Outbox pattern via Sequin and Redpanda, every business action becomes a first-class event. This design decouples core logic from side effects.You no longer need to build complex, blocking orchestration for billing, notifications, or third-party integrations. **Everything** reacts to the stream, ensuring the system remains resilient and "eventually consistent" by design rather than by accident.

This "Central Nervous System" approach is what makes Appcket truly AI-native. Because the event stream is the source of truth, AI agents are treated as first-class citizens. They don't have to scrape APIs or poll databases; they simply subscribe to the Redpanda topics they care about, process data asynchronously, and emit their own events. This allows you to "plug in" intelligent behaviors like fraud detection or automated summarization without ever touching your core GraphQL API code. Coupled with a Websockets-powered UI Gateway, the system provides a "live" experience where users and agents interact on a shared, real-time data backplane.

### ⚡From Request-Response to Event Streams

**Goodbye Request-Response Silos:** No more blocking your API while waiting for five different downstream services to respond. The Outbox ensures your data is saved and your event is published, period.

**A Dedicated Space for Agents:** Agents inhabit the event stream. They "see" the world through Redpanda events and "act" by producing their own, making them invisible yet powerful collaborators.

**Optimistic, Real-Time UI:** With the UIGatewayModule and Websockets, the UI transitions from a passive viewer to an active participant, receiving instant pushes the moment an event hits the bus.

**Built-in Trust & Vision:** Security is handled by Keycloak (OIDC/JWT) and observability is baked in via the Prometheus/Loki/Grafana stack, allowing you to trace the lifecycle of a single correlation_id across the entire distributed system.