<p align="center">
  <img src="icon.png" alt="File Storage Service Logo" width="120" height="120" />
</p>

# File Storage Service

A cloud-based file management system designed to securely store, organize, and retrieve user media and documents.

## Features

* **File Uploading:** Support for document and media object uploads up to 512MB per file.
* **Organization:** Create and manage custom directory structures for streamlined asset management.
* **Trash Lifecycle:** Soft-delete files by moving them to a dedicated trash bin.
* **Data Recovery:** Restore deleted files from the trash or execute permanent deletions to free up space.
* **Secure Access:** Email and password authentication protected by JSON Web Tokens (JWT).

## Tech Stack

| Domain | Technology | Use Case |
| --- | --- | --- |
| **Backend** | Java 21 & Spring 4.1 | Core API logic, file lifecycle handling, and JWT authentication |
| **Database** | PostgreSQL 16 | Relational metadata storage for users, files, and folder structures |
| **Frontend** | React (TypeScript) & Tailwind CSS | Responsive, type-safe user interface component design |
| **Storage** | AWS S3 | Highly scalable raw object storage for user documents and media |
| **CDN** | AWS CloudFront | Edge caching and low-latency global content delivery |
| **Hosting** | Render (Backend) & Vercel (Frontend) | Managed platform deployment for microservices and static assets |

## System Architecture

The frontend client built with React interacts with a RESTful Spring backend hosted on Render. User authentication relies on secure JWT transmission. Uploaded binary objects are pushed to an AWS S3 bucket, while stored file downloads are accelerated globally via AWS CloudFront. PostgreSQL acts as the single source of truth for file hierarchies, trash states, and user accounts. To ensure system reliability and data integrity, the core backend logic relies on rigorous automated testing workflows utilizing JUnit 4.

## Prerequisites

* Java Development Kit (JDK) 21
* Node.js (v18+) and npm/yarn
* PostgreSQL 16 server
* AWS Account (with S3 bucket and CloudFront distribution configured)

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/rahulstech/file-storage-service-java-spring-react.git
cd file-storage-service

```

**2. PgSQL Database Setup**
SmartERP requires PostgreSQL 16 or above. You can install it on your OS or spin up a PostgreSQL instance using Docker:

```bash
docker run --name file-storage-db \
  -e POSTGRES_DB=file_storage_db \
  -p 5432:5432 \
  -d postgres:16
```

To verify that the database container is running, execute:

```bash
docker ps
```

and look for container `file-storage-db`

**3. Backend Setup**
Navigate to the backend directory, configure your `application.properties` with your PostgreSQL credentials, AWS access keys, and JWT secret, then boot the server:

```bash
cd backend
./gradlew spring-boot:run

```

**4. Frontend Setup**
Navigate to the frontend directory, install dependencies, and start the development environment:

```bash
cd frontend
npm install
npm run dev

```

---

## Developer Contact

*   **LinkedIn**: [iamrahulbagchi](https://www.linkedin.com/in/iamrahulbagchi/)
*   **Email**: [rahulstech18@gmail.com](mailto:rahulstech18@gmail.com)