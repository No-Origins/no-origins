# Vercel REST API Integration Guide

This guide details the Vercel REST API endpoints, payloads, and request patterns used to monitor deployments, retrieve build-time events, and inspect runtime execution logs.

---

## 🔑 Authentication

All requests to the Vercel API must be authenticated using a Personal Access Token or Team Token.

* **Authorization Header**: `Authorization: Bearer <VERCEL_API_TOKEN>`
* **Team Parameter**: If your project belongs to a Vercel team, you must append the `teamId` as a query string parameter: `?teamId=team_xxxxxxxxxxxx`

---

## 📡 Essential Endpoints

### 1. List Recent Deployments
Retrieve a list of recent deployments for a specific project. This is used to extract the latest `deploymentId`.

* **HTTP Method**: `GET`
* **URL**: `https://api.vercel.com/v6/deployments`
* **Query Parameters**:
  * `projectId`: Unique ID of the target project (optional but recommended)
  * `limit`: Number of results (default `20`, max `100`)
* **cURL Example**:
  ```bash
  curl -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v6/deployments?projectId=prj_xxxxxxxxxxxx&limit=5"
  ```
* **Key Response Attributes**:
  * `deployments`: Array of deployment objects.
  * `uid`: Unique identifier for the deployment (used as `deploymentId` in other requests).
  * `state`: Status of the build (e.g. `READY`, `ERROR`, `BUILDING`, `QUEUED`).

---

### 2. Retrieve Specific Deployment Details
Inspect the complete state and configuration of a single deployment.

* **HTTP Method**: `GET`
* **URL**: `https://api.vercel.com/v13/deployments/{deploymentId}`
* **cURL Example**:
  ```bash
  curl -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v13/deployments/dpl_xxxxxxxxxxxx"
  ```
* **Response Values to Inspect**:
  * `readyState`: Status flag. If equal to `ERROR`, a build or configuration issue occurred.
  * `error`: Contains the structured error payload if the build failed.

---

### 3. Fetch Build Events / Build Logs
Retrieve the console outputs generated during the build and packaging phase. This is the primary telemetry source for debugging deployment failures.

* **HTTP Method**: `GET`
* **URL**: `https://api.vercel.com/v3/deployments/{deploymentId}/events`
* **Query Parameters**:
  * `direction`: `forward` or `backward` (default `forward`)
  * `follow`: `1` to stream new logs (Server-Sent Events)
* **cURL Example**:
  ```bash
  curl -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v3/deployments/dpl_xxxxxxxxxxxx/events"
  ```
* **Output Format**: A list of events, each containing a `text` string (e.g. `npm run build` console output).

---

### 4. Fetch Function Runtime Logs
Query execution logs emitted by Vercel Functions (Serverless/Edge) in real time.

* **HTTP Method**: `GET`
* **URL**: `https://api.vercel.com/v1/projects/{projectId}/deployments/{deploymentId}/runtime-logs`
* **cURL Example**:
  ```bash
  curl -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v1/projects/prj_xxxxxxxxxxxx/deployments/dpl_xxxxxxxxxxxx/runtime-logs"
  ```
* **Alternative (Log Drains)**: For high-volume production telemetry analysis, configure a **Vercel Log Drain** in your project integration settings to forward log streams directly to a data warehouse (e.g. Axiom, Datadog, Mezmo).

---

## 🛠️ CLI Diagnostics Helper Script

You can run the following quick bash/Node routine in the workspace to retrieve deployment errors:

```javascript
// scratch/check_vercel.js
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = "prj_xxxxxxxxxxxx";

async function checkDeployments() {
  const listRes = await fetch(`https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&limit=1`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  const data = await listRes.json();
  const latest = data.deployments?.[0];

  if (!latest) {
    console.log("No deployments found.");
    return;
  }

  console.log(`Latest Deployment: ${latest.uid} [${latest.url}]`);
  console.log(`State: ${latest.state}`);

  if (latest.state === "ERROR") {
    console.log("\n--- Build logs indicating failure ---");
    const logRes = await fetch(`https://api.vercel.com/v3/deployments/${latest.uid}/events`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
    });
    const logs = await logRes.json();
    logs.forEach(event => console.log(event.text));
  }
}

checkDeployments();
```
