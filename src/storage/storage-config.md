# Storage Service Configuration

This document explains how to configure the StorageService to work with either GCP Cloud Storage or local filesystem.

## Environment Variables

### Required Variables

```bash
# Storage location - determines which storage to use
STORAGE_LOCATION=GCP  # Use "GCP" for Google Cloud Storage or "LOCAL" for filesystem

# For Local Storage (when STORAGE_LOCATION=LOCAL)
LOCAL_STORAGE_PATH=./storage  # Optional, defaults to "./storage"
```

### GCP Storage Variables (when STORAGE_LOCATION=GCP)

```bash
# GCP Project and Bucket Configuration
GCP_PROJECT_ID=pipa-projects                  # Your GCP project ID
GCP_PUBLIC_BUCKET=your-public-bucket-name     # Optional, defaults to "linxng"
GCP_PRIVATE_BUCKET=your-private-bucket-name   # Optional, defaults to "linxng"

# Authentication Method 1: Service Account Key File
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Authentication Method 2: Direct Credentials (Alternative to key file)
SA_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
SA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----
```

## Configuration Examples

### Example 1: Local Storage Configuration

```bash
STORAGE_LOCATION=LOCAL
LOCAL_STORAGE_PATH=./uploads
```

This will save files to:

- Private files: `./uploads/private/`
- Public files: `./uploads/public/`

### Example 2: GCP Storage with Service Account Key File

```bash
STORAGE_LOCATION=GCP
GCP_PROJECT_ID=my-project
GCP_PUBLIC_BUCKET=my-public-bucket
GCP_PRIVATE_BUCKET=my-private-bucket
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Example 3: GCP Storage with Direct Credentials

```bash
STORAGE_LOCATION=GCP
GCP_PROJECT_ID=pipa-projects
SA_CLIENT_EMAIL=nadf-buckets@pipa-projects.iam.gserviceaccount.com
SA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCvjz0mBKsB/6P1...\n-----END PRIVATE KEY-----
```

## File Structure

### Local Storage Structure

```
./storage/
├── private/
│   └── documents/
│       ├── hello.txt
│       └── hello.txt.metadata.json
└── public/
    └── images/
        ├── photo.jpg
        └── photo.jpg.metadata.json
```

### GCP Storage Structure

Files are stored directly in the specified buckets with the provided file paths.

## Usage in Your Application

1. Import and inject the StorageService in your controllers/services
2. Use the provided methods: `saveFile()`, `getFile()`, `getFileWithMetadata()`, `deleteFile()`
3. The service automatically handles the storage location based on environment variables

## Security Notes

- Keep your GCP service account credentials secure
- Use private storage for sensitive files
- Consider using environment-specific buckets for development/production
