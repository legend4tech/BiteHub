# Deployment & Environment Strategy

This document outlines the general DevOps, deployment, and environment architecture for the application. Keep these principles in mind when deploying to production or onboarding new developers.

---

## 1. Environment Isolation 

The platform strictly enforces the separation of Development/Staging and Production environments. This ensures that test data and experimental features never impact the live user base.

### Database Architecture
You must use isolated database instances for different environments.
- **Development:** Used locally. Safe for schema migrations, test vendor creation, and dropping collections.
- **Production:** Used by the live deployment infrastructure. Contains real user data and must never be connected to local development clients.

### Media Storage Architecture
To prevent storage quota exhaustion and data mixing, media environments must be isolated.
- **Recommended Approach:** Maintain separate cloud storage credentials (e.g., dedicated sub-accounts or independent API keys) for development and production environments.
- **Alternative Approach:** Dynamically route uploads to environment-specific storage directories based on the `NODE_ENV` variable.

---

## 2. Serverless Networking Strategy

The application leverages serverless compute architecture for its frontend and API layer. This means the application scales dynamically across global server nodes, and compute instances are ephemeral.

### Database Network Configuration
Because serverless compute nodes do not have static IP addresses, traditional fixed-IP whitelisting is not viable.

**Standard Procedure:**
1. Configure your database provider's network access rules to accommodate dynamic compute architectures.
2. Rely entirely on **Authentication-Level Security**. The primary defense mechanism is the cryptographic strength of the connection URI credentials. 
3. Never expose connection strings in client-side code, and strictly manage them via secure deployment Environment Variables.

**Alternative:** 
Utilize built-in infrastructure integrations provided by your hosting platform (if available) to manage secure, dynamic networking tunnels automatically.

---

## 3. Environment Variables Reference

When setting up a new environment, ensure the following critical variables map to the correct external configurations:

| Service Layer | Local Environment | Production Environment |
|---|---|---|
| **Database** | Development DB credentials | Production DB credentials |
| **Media Storage**| Development API keys | Production API keys |
| **Application URL** | Localhost binding | Primary domain binding |
| **API Endpoint** | Local API routing | Live API routing |

---

*Security Note: Never commit environment configuration files (e.g., `.env`) to source control. Always refer to `.env.example` when onboarding.*
