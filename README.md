# ProcureIQ

### AI-Powered Indian Standards Intelligence for Smarter Procurement

ProcureIQ is an AI-powered recommendation engine that helps procurement teams identify relevant Indian Standards from product descriptions, technical specifications, and tender documents.

Instead of relying only on keyword-based searches, ProcureIQ uses multilingual semantic matching to understand the meaning of a procurement requirement and rank the most relevant Indian Standards.

The recommended standards are then enriched with structured information such as edition, status, certification requirements, amendments, QCO references, and related standards.

---

## Why ProcureIQ?

Finding the right Indian Standard for a procurement requirement can require searching through standards, checking their current status, verifying certification requirements, and identifying related standards.

ProcureIQ brings these steps together in one workflow.

### Core Approach

> **AI finds what is relevant. The database tells us what is authoritative.**

The AI layer is responsible for semantic matching and ranking. Authoritative standard information such as certification, status, edition, amendments, and relationships is retrieved from the structured database rather than being decided by the AI model.

---

## Key Features

- **Semantic Standard Recommendation**
  - Understands the meaning of a procurement requirement instead of depending only on exact keywords.
  - Uses multilingual sentence embeddings to rank relevant standards.

- **Text and Tender PDF Input**
  - Accepts natural-language procurement requirements and technical specifications.
  - Supports tender PDF upload with text extraction.

- **Multilingual Input**
  - Supports English, Hindi, Marathi, and Hinglish input.
  - The semantic model can match multilingual requirements against the English standard corpus.

- **Indian Standards Context**
  - Displays standard number, title, category, scope, edition, and status.
  - Shows certification information, QCO references, amendments, and related standards where available.

- **Certification and Compliance Information**
  - Certification requirements are maintained as structured database information.
  - Supports information related to BIS Product Certification, CRS, Hallmarking, and QCO applicability as represented in the dataset.

- **Standards Library**
  - Browse and explore the available Indian Standards.
  - View detailed information for individual standards.

- **Recommendation History During a Session**
  - Previous recommendation results are preserved while navigating between the dashboard and standard details.

- **Theme and Language Preferences**
  - Light and dark themes.
  - English, Hindi, and Marathi interface support.

---

## How It Works

```text
Procurement Requirement / Tender PDF
                |
                v
          React Frontend
                |
                v
        Spring Boot Backend
                |
                v
       FastAPI Semantic Engine
                |
        Multilingual Embeddings
                |
                v
       Semantic Similarity Search
                |
                v
        Ranked Standard Results
                |
                v
      MySQL Authoritative Data
                |
                v
 Certification | Edition | Status
 Amendments | QCO | Related Standards
                |
                v
          Enriched Results
```

### Semantic Matching

ProcureIQ uses:

`paraphrase-multilingual-MiniLM-L12-v2`

The model converts the procurement requirement into an embedding and compares it with embeddings of the standards in the ProcureIQ corpus.

Cosine similarity is used to rank the standards based on semantic relevance.

The prototype uses an in-memory NumPy-based similarity search over the current standards corpus.

---

## Technology Stack

### Frontend

- React
- Vite
- React Router
- CSS
- Multilingual UI and theme preferences

### Backend

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- JWT Authentication
- MySQL
- Redis
- Maven

### AI Service

- Python
- FastAPI
- Sentence Transformers
- `paraphrase-multilingual-MiniLM-L12-v2`
- NumPy
- Pandas
- PDF text extraction

---

## Project Structure

```text
ProcureIQ/
│
├── frontend/
│   ├── src/
│   └── ...
│
├── backend/
│   ├── src/
│   ├── database/
│   └── pom.xml
│
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── model.py
│   │   ├── embeddings.py
│   │   ├── similarity.py
│   │   ├── pdf_parser.py
│   │   └── schemas.py
│   ├── embeddings.npy
│   └── requirements.txt
│
├── data/
│   ├── standards.csv
│   ├── certification_requirements.csv
│   └── standard_relationships.csv
│
└── README.md
```

---

## Data Model

The prototype maintains three main standard-related datasets:

### `standards.csv`

Contains the master information for the standards, including:

- IS Number
- Title
- Category
- Scope
- Edition
- Status
- Superseding Standard
- Amendment Information
- Certification Information
- QCO Reference
- Related Standards
- Verification Status
- Source URL

### `certification_requirements.csv`

Stores certification-related information associated with standards, including requirement status, certification type, description, and QCO references.

### `standard_relationships.csv`

Stores relationships between standards and related standard references.

---

## Current Prototype Scope

The current prototype demonstrates the complete recommendation workflow using a curated corpus of **60 Indian Standards** across:

- Civil / Construction
- Electrical / Electronics
- Safety Equipment
- Packaging

The architecture is designed so that the standards corpus can be expanded without changing the overall recommendation workflow.

---

## Security

ProcureIQ uses JWT-based authentication for protected backend APIs.

Sensitive configuration such as database credentials and JWT secrets is provided through environment variables rather than being stored directly in the application configuration.

---

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/ketakipatil57/ProcureIQ.git
cd ProcureIQ
```

### 2. Start MySQL

Create the ProcureIQ database and import the schema and dataset using the SQL files provided in the project.

The backend expects MySQL to be available locally.

### 3. Start Redis

If Redis caching is enabled:

```bash
docker run --name procureiq-redis -p 6379:6379 -d redis
```

### 4. Start the AI Service

```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

The AI service will be available at:

```text
http://localhost:8000
```

### 5. Start the Spring Boot Backend

Set the required environment variables:

```text
DB_USERNAME
DB_PASSWORD
JWT_SECRET
```

The backend also uses:

```text
FASTAPI_BASE_URL=http://localhost:8000
REDIS_HOST=localhost
REDIS_PORT=6379
```

Then run:

```bash
cd backend
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development server.

---

## Example Workflow

A procurement officer can enter a requirement such as:

```text
Cement used for construction of concrete structures
```

ProcureIQ processes the requirement through the semantic engine and returns a ranked list of relevant Indian Standards.

Each recommendation can then be explored to view available information such as:

- Standard number
- Title
- Relevance score
- Scope
- Edition
- Current status
- Certification information
- QCO references
- Amendments
- Related standards

The same workflow can be initiated using a tender PDF.

---

## Design Principle

ProcureIQ keeps semantic recommendation and authoritative information separate.

```text
AI Layer
Semantic understanding
        ↓
Relevant standards
        ↓
Database Layer
Verified structured information
        ↓
Procurement-ready context
```

This separation allows the AI system to focus on finding relevant standards while structured data remains responsible for compliance and standards information.

---

## Future Scope

The current prototype establishes the core recommendation workflow. The system can be extended with:

- A larger Indian Standards corpus
- More comprehensive standards relationships
- Broader certification and regulatory coverage
- Improved document processing for complex tender documents
- Scalable vector search for larger standards collections
- Additional procurement workflows

---

## Team

**The Debug Duo**

Built for the **She Solves 3.0** hackathon.

---

## References

- [BIS — Know Your Standards](https://standards.bis.gov.in/)
- [BIS — Product Certification](https://www.bis.gov.in/product-certification/)
- [BIS — BIS Apps / CARE](https://www.bis.gov.in/bis-apps/)
- [Sentence Transformers — Semantic Search](https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html)
- [paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)

---



## License

This project was developed as a hackathon prototype.
