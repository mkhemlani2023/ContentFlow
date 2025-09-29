# System Overview

## Current State Assessment

**SEO Wizard Legacy Assets**:
- ✅ OpenRouter AI integration (proven at scale)
- ✅ Credit system foundation (requires enhancement)
- ✅ User authentication & dashboard (needs modernization)
- ✅ Content optimization algorithms (solid foundation)

**Evolution Requirements**:
- Migrate from expensive DataforSEO ($200-500/month) to Serper API ($50/month)
- Add document upload & processing pipeline
- Implement multi-platform publishing automation
- Enhance credit system for modern SaaS pricing
- Scale from hundreds to thousands of users

## Target Architecture Vision

```mermaid
graph TB
    subgraph "User Interface Layer"
        WEB[Web Application]
        MOBILE[Mobile Responsive]
        API_DOCS[API Documentation]
    end

    subgraph "API Gateway Layer"
        GATEWAY[API Gateway]
        AUTH[Authentication]
        RATE[Rate Limiting]
        LOGGING[Request Logging]
    end

    subgraph "Core Services Layer"
        CONTENT[Content Processing Service]
        PUBLISH[Publishing Engine]
        ANALYTICS[Analytics Service]
        CREDIT[Credit Management]
        USER[User Management]
    end

    subgraph "External Integrations"
        SERPER[Serper API]
        OPENROUTER[OpenRouter AI]
        SOCIAL[Platform APIs]
        PAYMENT[Stripe/Billing]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[Document Storage]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    GATEWAY --> CONTENT
    GATEWAY --> PUBLISH
    GATEWAY --> ANALYTICS
    GATEWAY --> CREDIT
    GATEWAY --> USER

    CONTENT --> SERPER
    CONTENT --> OPENROUTER
    PUBLISH --> SOCIAL
    CREDIT --> PAYMENT

    CONTENT --> POSTGRES
    PUBLISH --> POSTGRES
    ANALYTICS --> POSTGRES
    CREDIT --> POSTGRES
    USER --> POSTGRES

    CONTENT --> REDIS
    PUBLISH --> REDIS
    CONTENT --> S3
```