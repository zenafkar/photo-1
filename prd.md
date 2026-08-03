# Product Requirements Document (PRD)

## Zen Studio

### Professional Product Photos. Authentic Products.

**Version:** 2.0 (AI-Native Architecture)

---

# 1. Executive Summary

* Product Overview
* Vision
* Mission
* Product Principles
* Product Integrity Guarantee™

---

# 2. Market Opportunity

* Kondisi pasar UMKM Indonesia
* Pertumbuhan social commerce
* Tantangan fotografi produk
* AI Adoption Trend
* Total Addressable Market (TAM)
* Serviceable Addressable Market (SAM)
* Serviceable Obtainable Market (SOM)

---

# 3. Competitive Analysis

Perbandingan dengan:

* Photoroom
* Pebblely
* Flair AI
* Canva AI
* Adobe Firefly
* Remini
* Clipdrop

Matrix perbandingan fitur, kelebihan, kekurangan, dan peluang diferensiasi.

---

# 4. Product Positioning

Mengapa Zen Studio berbeda?

* Bukan AI Image Generator
* AI Product Photo Designer
* Product Integrity Guarantee™

---

# 5. User Persona

Persona lengkap:

* UMKM Owner
* Social Commerce Seller
* Reseller
* Dropshipper

Lengkap dengan:

* Goals
* Frustrations
* Behavior
* Device
* Purchasing Power

---

# 6. Jobs To Be Done (JTBD)

Contoh:

"When I want to upload a product to Shopee, I want a professional-looking product photo without changing my product so customers trust what they receive."

---

# 7. User Journey

Journey lengkap dari:

Awareness

↓

Sign Up

↓

Upload

↓

Generate

↓

Compare

↓

Download

↓

Publish

↓

Repeat

---

# 8. Product Features

Semua fitur MVP dan roadmap.

Setiap fitur memiliki:

* Objective
* User Story
* Acceptance Criteria
* Edge Cases
* Success Metrics

---

# 9. AI Architecture

## Multi Model Pipeline

Upload

↓

SAM 2

↓

Grounding DINO

↓

Product Lock Engine

↓

Prompt Builder

↓

FLUX Image Editing

↓

Lighting Harmonizer

↓

Shadow Generator

↓

Authenticity Validator

↓

Export

---

# 10. Product Integrity Engine™

Komponen:

* Product Detection
* Instance Segmentation
* Shape Validation
* Color Validation
* OCR Validation
* Logo Detection
* Texture Similarity
* Structural Similarity (SSIM)
* CLIP Similarity
* Regeneration Logic

Output:

Integrity Score

---

# 11. AI Prompt Pipeline

Template prompt berdasarkan:

* Product Category
* Marketplace
* Target Audience
* Style
* Lighting
* Composition
* Props

Negative Prompt:

* Never change logo
* Never change label
* Never change color
* Never modify shape
* Never hallucinate product details

---

# 12. Technical Architecture

Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS

Mobile

* Flutter

Backend

* FastAPI

AI

* Python
* PyTorch
* Hugging Face

Queue

* Redis

Database

* PostgreSQL

Storage

* Cloudflare R2

CDN

* Cloudflare

Analytics

* PostHog

Monitoring

* OpenTelemetry
* Grafana

Deployment

* Docker
* Kubernetes

---

# 13. System Architecture

API Gateway

↓

Auth Service

↓

User Service

↓

AI Orchestrator

↓

Image Processing Service

↓

Integrity Service

↓

Export Service

↓

Notification Service

---

# 14. Database Design

Entity:

* User
* Subscription
* Project
* Original Image
* Generated Image
* AI Job
* Style Preset
* Authenticity Report
* Download History
* Payment

Lengkap dengan ER Diagram.

---

# 15. API Specification

REST API:

* Authentication
* Upload
* Generate
* Job Status
* Download
* Billing
* Style Library

Disertai contoh request dan response.

---

# 16. Security Architecture

* HTTPS
* JWT
* OAuth
* Encryption at Rest
* Encryption in Transit
* Rate Limiting
* WAF
* Audit Log
* Malware Scan
* Image Validation

---

# 17. Privacy

* User Data Policy
* Image Retention
* AI Training Consent
* Right to Delete
* Compliance Roadmap

---

# 18. Pricing

Free

Premium

Fair Use Policy

Upgrade Flow

Billing Flow

Cancellation Flow

---

# 19. Cost Optimization

* GPU Queue
* Batch Inference
* Model Routing
* CDN Cache
* Image Compression
* Lazy Processing

Target:
Biaya inferensi tetap efisien tanpa mengorbankan kualitas.

---

# 20. Analytics

North Star Metric

Activation

Retention

Conversion

Monthly Active Users

Image Generated

Revenue

Churn

---

# 21. OKR

Company OKR

Product OKR

Engineering OKR

AI OKR

Growth OKR

---

# 22. Roadmap

MVP

↓

Public Beta

↓

Premium Launch

↓

Marketplace Integration

↓

AI Video

↓

Global Expansion

---

# 23. Risk Register

* GPU Cost
* AI Hallucination
* Copyright
* Privacy
* Abuse
* Scalability
* Fraud
* Subscription Abuse

Mitigasi untuk setiap risiko.

---

# 24. Appendix

* Glossary
* Style Guide
* Prompt Guide
* Marketplace Image Guidelines
* References
