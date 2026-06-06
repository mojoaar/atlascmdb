const endpoints = [
  {
    "category": "Applications",
    "method": "GET",
    "path": "/api/applications",
    "description": "List all applications with vendor/version info.",
    "auth": "any",
    "query": {
      "search": "CRM",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "CRM System",
          "vendor": "Salesforce",
          "version": "2024.1",
          "lifecycleStatus": "production",
          "ownerTeamName": "Sales"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Applications",
    "method": "POST",
    "path": "/api/applications",
    "description": "Create an application.",
    "auth": "editor+",
    "body": {
      "name": "New App",
      "description": "Internal tool",
      "vendor": "Acme",
      "version": "1.0",
      "applicationType": "saas",
      "ownerTeamId": "uuid",
      "lifecycleStatus": "active",
      "environment": "production",
      "classification": "internal",
      "externalRef": "EXT-001"
    },
    "response": {
      "id": "uuid",
      "name": "New App",
      "vendor": "Acme",
      "version": "1.0",
      "lifecycleStatus": "active"
    }
  },
  {
    "category": "Applications",
    "method": "GET",
    "path": "/api/applications/{id}",
    "description": "Get a single application with all fields.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "CRM System",
      "description": "Customer management",
      "vendor": "Salesforce",
      "version": "2024.1",
      "applicationType": "saas",
      "lifecycleStatus": "production",
      "ownerTeamName": "Sales",
      "environment": "production",
      "classification": "internal",
      "externalRef": "EXT-001",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "category": "Applications",
    "method": "PATCH",
    "path": "/api/applications/{id}",
    "description": "Update an application.",
    "auth": "editor+",
    "body": {
      "vendor": "NewVendor",
      "version": "2.0"
    },
    "response": {
      "id": "uuid",
      "name": "CRM System",
      "vendor": "NewVendor",
      "version": "2.0"
    }
  },
  {
    "category": "Applications",
    "method": "DELETE",
    "path": "/api/applications/{id}",
    "description": "Delete an application.",
    "auth": "admin",
    "response": {
      "message": "Application deleted"
    }
  },
  {
    "category": "Assets",
    "method": "GET",
    "path": "/api/assets",
    "description": "List all assets with CI, location, and assigned user joins.",
    "auth": "any",
    "query": {
      "search": "laptop",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "MacBook Pro",
          "assetTag": "AT-001",
          "category": "Hardware",
          "model": "MBP M3",
          "status": "in_use",
          "ciName": "web-01",
          "locationName": "Aarhus Office",
          "assignedToName": "Alice Admin",
          "cost": 2499.99
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Assets",
    "method": "POST",
    "path": "/api/assets",
    "description": "Create an asset.",
    "auth": "editor+",
    "body": {
      "name": "ThinkPad X1",
      "assetTag": "AT-020",
      "category": "Hardware",
      "model": "X1 Carbon",
      "status": "in_use",
      "ciId": "uuid",
      "assignedTo": "uuid",
      "locationId": "uuid",
      "supplier": "Lenovo",
      "purchaseDate": "2024-01-15",
      "warrantyExpiry": "2027-01-15",
      "cost": 1899,
      "notes": "Standard issue"
    },
    "response": {
      "id": "uuid",
      "name": "ThinkPad X1",
      "assetTag": "AT-020",
      "category": "Hardware",
      "status": "in_use"
    }
  },
  {
    "category": "Assets",
    "method": "GET",
    "path": "/api/assets/{id}",
    "description": "Get a single asset with all joins.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "MacBook Pro",
      "assetTag": "AT-001",
      "category": "Hardware",
      "model": "MBP M3",
      "serialNumber": "SN-123",
      "status": "in_use",
      "ciName": "web-01",
      "locationName": "Aarhus Office",
      "assignedToName": "Alice Admin",
      "supplier": "Apple",
      "purchaseDate": "2024-01-15",
      "warrantyExpiry": "2027-01-15",
      "cost": 2499.99,
      "notes": "Engineering laptop",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "category": "Assets",
    "method": "PATCH",
    "path": "/api/assets/{id}",
    "description": "Update an asset.",
    "auth": "editor+",
    "body": {
      "status": "retired",
      "notes": "Decommissioned"
    },
    "response": {
      "id": "uuid",
      "status": "retired",
      "notes": "Decommissioned"
    }
  },
  {
    "category": "Assets",
    "method": "DELETE",
    "path": "/api/assets/{id}",
    "description": "Delete an asset.",
    "auth": "admin",
    "response": {
      "message": "Asset deleted"
    }
  },
  {
    "category": "Audit",
    "method": "GET",
    "path": "/api/audit-events",
    "description": "List audit events with optional entity type filter.",
    "auth": "any",
    "query": {
      "entityType": "service",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "actorDisplayName": "Alice Admin",
          "entityType": "service",
          "entityId": "uuid",
          "action": "updated",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Audit",
    "method": "GET",
    "path": "/api/audit-events/{id}",
    "description": "Get a single audit event with before/after snapshots.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "actorUserId": "uuid",
      "actorDisplayName": "Alice Admin",
      "entityType": "service",
      "entityId": "uuid",
      "action": "updated",
      "beforeData": {
        "name": "Old Name"
      },
      "afterData": {
        "name": "New Name"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/forgot-password",
    "description": "Request a password reset link via email.",
    "auth": "None",
    "body": {
      "email": "alice@atlas.local"
    },
    "response": {
      "message": "If the email exists, a reset link has been sent"
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/login",
    "description": "Authenticate with email and password. Returns tokens; may redirect to MFA if enabled.",
    "auth": "None",
    "body": {
      "email": "alice@atlas.local",
      "password": "password123"
    },
    "response": {
      "accessToken": "eyJhbGciOiJI...",
      "refreshToken": "abc123...",
      "sessionId": "uuid",
      "user": {
        "id": "uuid",
        "email": "alice@atlas.local",
        "displayName": "Alice Admin",
        "mfaEnabled": false
      }
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/logout",
    "description": "Clear session and remove httpOnly cookies.",
    "auth": "any",
    "response": {
      "message": "Logged out"
    }
  },
  {
    "category": "Authentication",
    "method": "GET",
    "path": "/api/auth/me",
    "description": "Return the currently authenticated user with roles, teams, and locale preferences.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "email": "alice@atlas.local",
      "displayName": "Alice Admin",
      "roles": [
        "admin"
      ],
      "teams": [],
      "mfaEnabled": false,
      "timezone": "Europe/Copenhagen",
      "clockFormat": "24h",
      "dateFormat": "DD/MM/YYYY"
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/mfa/setup",
    "description": "Generate a TOTP secret for MFA enrollment.",
    "auth": "any",
    "response": {
      "secret": "JBSWY3DPEHPK3PXP",
      "otpauthUrl": "otpauth://totp/Atlas:alice@atlas.local?secret=JBSWY3DPEHPK3PXP&issuer=Atlas",
      "qrCodeDataUrl": "data:image/..."
    }
  },
  {
    "category": "Authentication",
    "method": "PUT",
    "path": "/api/auth/mfa/setup",
    "description": "Enable MFA for the current user after verifying setup.",
    "auth": "any",
    "body": {
      "code": "123456"
    },
    "response": {
      "mfaEnabled": true
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/mfa/verify",
    "description": "Verify a TOTP code to complete MFA login flow.",
    "auth": "None",
    "body": {
      "mfaToken": "...",
      "code": "123456"
    },
    "response": {
      "accessToken": "eyJhbGciOiJI...",
      "refreshToken": "abc123...",
      "sessionId": "uuid",
      "user": {
        "id": "uuid",
        "email": "alice@atlas.local",
        "displayName": "Alice Admin",
        "mfaEnabled": true
      }
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/refresh",
    "description": "Rotate refresh token and return a new token pair.",
    "auth": "any",
    "body": {
      "refreshToken": "abc123...",
      "sessionId": "uuid"
    },
    "response": {
      "accessToken": "eyJhbGciOiJI...",
      "refreshToken": "def456...",
      "sessionId": "uuid"
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/reset-password",
    "description": "Reset password using a reset token.",
    "auth": "None",
    "body": {
      "token": "reset-token",
      "password": "new-password"
    },
    "response": {
      "message": "Password reset successful"
    }
  },
  {
    "category": "Authentication",
    "method": "GET",
    "path": "/api/auth/sso/callback",
    "description": "OIDC callback handler. Exchanges authorization code for tokens, creates/finds user, sets session.",
    "auth": "None",
    "query": {
      "code": "auth-code",
      "state": "pkce-state"
    },
    "response": {
      "accessToken": "eyJhbGciOiJI...",
      "refreshToken": "abc123...",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "displayName": "SSO User"
      }
    }
  },
  {
    "category": "Authentication",
    "method": "POST",
    "path": "/api/auth/sso/initiate",
    "description": "Initiate OIDC SSO login. Redirects to the configured IdP (PKCE S256).",
    "auth": "None",
    "response": {
      "redirectUrl": "https://idp.example.com/authorize?client_id=...&code_challenge=..."
    }
  },
  {
    "category": "Bulk Operations",
    "method": "DELETE",
    "path": "/api/bulk",
    "description": "Delete multiple entities by type and IDs.",
    "auth": "admin",
    "body": {
      "entityType": "services",
      "ids": [
        "uuid-1",
        "uuid-2"
      ]
    },
    "response": {
      "deleted": 2
    }
  },
  {
    "category": "Config",
    "method": "GET",
    "path": "/api/config/public",
    "description": "Get public configuration values (unauthenticated). Used by the login screen to check the ASCII logo preference.",
    "auth": "None",
    "response": {
      "login_ascii_logo": "false"
    }
  },
  {
    "category": "Config",
    "method": "GET",
    "path": "/api/config",
    "description": "Get system configuration settings.",
    "auth": "admin",
    "response": {
      "sso_enabled": "false",
      "oidc_issuer_url": "",
      "oidc_client_id": "",
      "scim_enabled": "false",
      "row_limit_default": "100",
      "attachment_allowed_types": ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg",
      "login_ascii_logo": "false",
      "scim_bearer_token_set": true,
      "oidc_client_secret_masked": "oidc-cli••••••••"
    }
  },
  {
    "category": "Config",
    "method": "PUT",
    "path": "/api/config",
    "description": "Update system configuration settings.",
    "auth": "admin",
    "body": {
      "sso_enabled": "true",
      "oidc_issuer_url": "https://accounts.google.com",
      "oidc_client_id": "abc123.apps.googleusercontent.com",
      "oidc_client_secret": "secret123",
      "scim_enabled": "true",
      "scim_bearer_token": "scim-token-val",
      "row_limit_default": "100",
      "attachment_allowed_types": ".pdf,.docx,...",
      "login_ascii_logo": "true"
    },
    "response": {
      "updated": true
    }
  },
  {
    "category": "Configuration Items",
    "method": "GET",
    "path": "/api/cis",
    "description": "List all CIs with location and team joins.",
    "auth": "any",
    "query": {
      "search": "server",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "web-01.example.com",
          "ciType": "server",
          "lifecycleStatus": "production",
          "ownerTeamName": "Infrastructure",
          "locationName": "DC-East"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Configuration Items",
    "method": "POST",
    "path": "/api/cis",
    "description": "Create a CI.",
    "auth": "editor+",
    "body": {
      "name": "db-01",
      "description": "Primary database",
      "ownerTeamId": "uuid",
      "locationId": "uuid",
      "lifecycleStatus": "active",
      "environment": "production",
      "classification": "confidential",
      "externalRef": "DB-001",
      "ciType": "database",
      "serialNumber": "SN12345",
      "assetTag": "AT-67890",
      "rackSize": 42,
      "rackModel": "APC NetShelter SX"
    },
    "response": {
      "id": "uuid",
      "name": "db-01",
      "ciType": "database",
      "rackSize": 42,
      "rackModel": "APC NetShelter SX",
      "lifecycleStatus": "active",
      "locationName": "DC-East"
    }
  },
  {
    "category": "Configuration Items",
    "method": "GET",
    "path": "/api/cis/{id}",
    "description": "Get a single CI with full details and joins.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "web-01.example.com",
      "description": "Production web server",
      "ciType": "server",
      "serialNumber": "SN12345",
      "assetTag": "AT-67890",
      "lifecycleStatus": "production",
      "environment": "production",
      "classification": "internal",
      "ownerTeamName": "Infrastructure",
      "locationName": "DC-East",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "category": "Configuration Items",
    "method": "PATCH",
    "path": "/api/cis/{id}",
    "description": "Update a CI. Fields split between ci_base and cis child table.",
    "auth": "editor+",
    "body": {
      "name": "web-02",
      "serialNumber": "SN-99999",
      "environment": "staging"
    },
    "response": {
      "id": "uuid",
      "name": "web-02",
      "serialNumber": "SN-99999",
      "environment": "staging"
    }
  },
  {
    "category": "Configuration Items",
    "method": "DELETE",
    "path": "/api/cis/{id}",
    "description": "Delete a CI (cascades to child table).",
    "auth": "admin",
    "response": {
      "message": "CI deleted"
    }
  },
  {
    "category": "Export",
    "method": "GET",
    "path": "/api/export/{entityType}",
    "description": "Export entity data as JSON array. Supports: services, applications, cis, assets, teams, locations, roles, users, themes, relationships.",
    "auth": "any",
    "response": [
      {
        "id": "uuid",
        "name": "Customer Portal",
        "lifecycleStatus": "production"
      }
    ]
  },
  {
    "category": "Graph",
    "method": "GET",
    "path": "/api/entities/{type}/{id}/graph",
    "description": "Get relationship graph data (nodes + edges, configurable depth) for services, applications, and CIs.",
    "auth": "any",
    "response": {
      "center": {
        "id": "uuid",
        "type": "service",
        "name": "Customer Portal"
      },
      "nodes": [
        {
          "id": "uuid",
          "type": "service",
          "data": {
            "label": "Customer Portal",
            "entityType": "service"
          },
          "position": {
            "x": 100,
            "y": 50
          }
        }
      ],
      "edges": [
        {
          "id": "uuid",
          "source": "uuid",
          "target": "uuid",
          "sourceHandle": "s",
          "targetHandle": "t",
          "label": "depends on",
          "animated": false
        }
      ]
    },
    "query": {
      "depth": "3 (1-6 levels)"
    }
  },
  {
    "category": "Import",
    "method": "GET",
    "path": "/api/import/templates",
    "description": "Get available import templates for entity types.",
    "auth": "any",
    "response": [
      {
        "name": "Service Import",
        "entityType": "service",
        "fields": [
          "name",
          "description",
          "ownerTeamId"
        ]
      }
    ]
  },
  {
    "category": "Import",
    "method": "POST",
    "path": "/api/import/upload",
    "description": "Upload a CSV or JSON file for import. Accepts multipart/form-data (file key) or JSON body with content. Parses file, creates import_set with rows.",
    "auth": "any",
    "body": {
      "filename": "services.csv",
      "content": "name,description\nPayment API,API Gateway"
    },
    "response": {
      "id": "uuid",
      "name": "services",
      "status": "uploaded",
      "rowCount": 1,
      "columns": [
        "name",
        "description"
      ]
    }
  },
  {
    "category": "Import Pipeline",
    "method": "GET",
    "path": "/api/import-sets",
    "description": "List all import sets.",
    "auth": "any",
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "Nov 2024 Service Import",
          "sourceType": "csv",
          "status": "committed",
          "createdByName": "Alice Admin",
          "createdAt": "2024-11-01T00:00:00.000Z"
        }
      ],
      "total": 1
    },
    "query": {
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    }
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets",
    "description": "Create a new import set.",
    "auth": "editor+",
    "body": {
      "name": "Q1 2025 Import",
      "sourceType": "csv",
      "entityType": "service"
    },
    "response": {
      "id": "uuid",
      "name": "Q1 2025 Import",
      "sourceType": "csv",
      "status": "new"
    }
  },
  {
    "category": "Import Pipeline",
    "method": "GET",
    "path": "/api/import-sets/{id}",
    "description": "Get an import set with mappings.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "Nov 2024 Service Import",
      "sourceType": "csv",
      "status": "committed",
      "entityType": "service",
      "mappings": [
        {
          "sourceField": "svc_name",
          "targetField": "name"
        }
      ],
      "totalRows": 50,
      "validRows": 48,
      "errorRows": 2
    }
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets/{id}",
    "description": "Upload rows and mappings for an import set.",
    "auth": "editor+",
    "body": {
      "rows": [
        {
          "svc_name": "Payment API",
          "svc_desc": "API Gateway"
        }
      ],
      "mappings": [
        {
          "sourceField": "svc_name",
          "targetField": "name"
        }
      ]
    },
    "response": {
      "rowsImported": 1,
      "mappingsCreated": 1
    }
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets/{id}/commit",
    "description": "Commit valid rows to the target entity tables.",
    "auth": "editor+",
    "response": {
      "committed": 48,
      "errors": 0,
      "createdEntityIds": [
        "uuid",
        "uuid"
      ]
    }
  },
  {
    "category": "Import Pipeline",
    "method": "GET",
    "path": "/api/import-sets/{id}/history",
    "description": "Get commit history for an import set.",
    "auth": "any",
    "response": [
      {
        "batchId": "uuid",
        "committedAt": "2024-11-01T00:00:00.000Z",
        "rowCount": 48,
        "committedBy": "Alice Admin",
        "entityIds": [
          "uuid"
        ]
      }
    ]
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets/{id}/map",
    "description": "Apply mappings to transform source data into target fields.",
    "auth": "editor+",
    "response": {
      "mappedRows": 50
    }
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets/{id}/preview",
    "description": "Preview the valid rows that would be committed.",
    "auth": "editor+",
    "query": {
      "limit": 10
    },
    "response": [
      {
        "rowIndex": 0,
        "transformed": {
          "name": "Payment API",
          "description": "API Gateway"
        },
        "targetTable": "service_base"
      }
    ]
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets/{id}/retry",
    "description": "Retry rows that had validation errors.",
    "auth": "editor+",
    "body": {
      "rowIds": [
        "uuid",
        "uuid"
      ],
      "overwriteMappedData": {
        "name": "Fixed Name"
      }
    },
    "response": {
      "committed": 0
    }
  },
  {
    "category": "Import Pipeline",
    "method": "GET",
    "path": "/api/import-sets/{id}/rows",
    "description": "Get all rows in an import set.",
    "auth": "any",
    "query": {
      "limit": 50,
      "offset": 0
    },
    "response": [
      {
        "id": "uuid",
        "rowIndex": 0,
        "sourceData": {
          "svc_name": "Payment API",
          "svc_desc": "API Gateway"
        },
        "mappedData": null,
        "validationErrors": null,
        "status": "pending"
      }
    ]
  },
  {
    "category": "Import Pipeline",
    "method": "POST",
    "path": "/api/import-sets/{id}/validate",
    "description": "Validate mapped rows against field rules.",
    "auth": "editor+",
    "response": {
      "validRows": 48,
      "errorRows": 2
    }
  },
  {
    "category": "Integrations",
    "method": "GET",
    "path": "/api/integrations",
    "description": "List all configured integration connectors (API keys masked).",
    "auth": "admin",
    "query": {
      "limit": 20,
      "offset": 0
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "My Next Insight",
          "connectorType": "next_insight",
          "enabled": 1,
          "baseUrl": "https://yourcompany.next-insight.com",
          "apiKey": "sk-abc123••••••••••••",
          "conflictMode": "merge",
          "lastSyncAt": "2026-06-06T12:34:56.789Z",
          "lastSyncStatus": "success",
          "lastSyncSummary": "Created 12, Updated 3, Skipped 0, Errored 0"
        }
      ]
    }
  },
  {
    "category": "Integrations",
    "method": "POST",
    "path": "/api/integrations",
    "description": "Create a new integration connector.",
    "auth": "admin",
    "body": {
      "name": "My Next Insight",
      "connectorType": "next_insight",
      "baseUrl": "https://yourcompany.next-insight.com",
      "apiKey": "sk-abc123def456",
      "conflictMode": "merge",
      "fieldOverrides": {
        "lifecycleStatus": "skip",
        "environment": "overwrite"
      }
    },
    "response": {
      "id": "uuid",
      "name": "My Next Insight",
      "connectorType": "next_insight",
      "apiKey": "sk-abc123••••••••••••",
      "conflictMode": "merge",
      "createdAt": "2026-06-06T12:00:00.000Z"
    }
  },
  {
    "category": "Integrations",
    "method": "PATCH",
    "path": "/api/integrations/:id",
    "description": "Update an integration connector (name, URL, API key, conflict mode, field overrides, enabled toggle).",
    "auth": "admin",
    "body": {
      "name": "Renamed Connector",
      "enabled": 0,
      "conflictMode": "overwrite",
      "fieldOverrides": {
        "classification": "merge"
      }
    },
    "response": {
      "id": "uuid",
      "name": "Renamed Connector",
      "enabled": 0,
      "conflictMode": "overwrite",
      "apiKey": "sk-abc123••••••••••••"
    }
  },
  {
    "category": "Integrations",
    "method": "DELETE",
    "path": "/api/integrations/:id",
    "description": "Permanently delete an integration connector and all its sync logs.",
    "auth": "admin",
    "response": {
      "deleted": true
    }
  },
  {
    "category": "Integrations",
    "method": "POST",
    "path": "/api/integrations/:id/sync",
    "description": "Trigger a manual sync. Pulls entities from the external system and applies conflict resolution.",
    "auth": "admin",
    "response": {
      "logId": "uuid",
      "status": "success",
      "created": 12,
      "updated": 3,
      "skipped": 0,
      "errored": 0,
      "errors": []
    }
  },
  {
    "category": "Integrations",
    "method": "GET",
    "path": "/api/integrations/:id/logs",
    "description": "Retrieve sync history for a connector with pagination.",
    "auth": "admin",
    "query": {
      "limit": 50,
      "offset": 0
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "connectorId": "uuid",
          "startedAt": "2026-06-06T12:00:00.000Z",
          "completedAt": "2026-06-06T12:00:05.000Z",
          "status": "success",
          "recordsCreated": 12,
          "recordsUpdated": 3,
          "recordsSkipped": 0,
          "recordsErrored": 0
        }
      ],
      "total": 5,
      "limit": 50,
      "offset": 0
    }
  },
  {
    "category": "Integrations",
    "method": "POST",
    "path": "/api/integrations/test",
    "description": "Test connection to an integration endpoint without saving a connector.",
    "auth": "admin",
    "body": {
      "connectorType": "next_insight",
      "baseUrl": "https://yourcompany.next-insight.com",
      "apiKey": "sk-abc123def456"
    },
    "response": {
      "ok": true,
      "message": "Connection successful"
    }
  },
  {
    "category": "Locations",
    "method": "GET",
    "path": "/api/locations",
    "description": "List all locations with parent reference.",
    "auth": "any",
    "query": {
      "search": "DC",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "DC-East",
          "type": "data_center",
          "status": "active",
          "parentId": null,
          "parentLocationName": null,
          "address": "100 Main St"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Locations",
    "method": "POST",
    "path": "/api/locations",
    "description": "Create a location.",
    "auth": "editor+",
    "body": {
      "name": "DC-West",
      "type": "data_center",
      "status": "active",
      "parentId": null,
      "address": "500 Oak Ave",
      "city": "Portland",
      "country": "US"
    },
    "response": {
      "id": "uuid",
      "name": "DC-West",
      "type": "data_center",
      "status": "active"
    }
  },
  {
    "category": "Locations",
    "method": "GET",
    "path": "/api/locations/{id}",
    "description": "Get a single location with children.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "DC-East",
      "type": "data_center",
      "status": "active",
      "parentId": null,
      "address": "100 Main St",
      "city": "New York",
      "country": "US",
      "children": [
        {
          "id": "uuid",
          "name": "Rack-A1",
          "type": "rack"
        }
      ]
    }
  },
  {
    "category": "Locations",
    "method": "PATCH",
    "path": "/api/locations/{id}",
    "description": "Update a location.",
    "auth": "editor+",
    "body": {
      "name": "DC-East-Updated",
      "city": "Brooklyn"
    },
    "response": {
      "id": "uuid",
      "name": "DC-East-Updated",
      "city": "Brooklyn"
    }
  },
  {
    "category": "Locations",
    "method": "DELETE",
    "path": "/api/locations/{id}",
    "description": "Delete a location.",
    "auth": "admin",
    "response": {
      "message": "Location deleted"
    }
  },
  {
    "category": "Notifications",
    "method": "GET",
    "path": "/api/notifications",
    "description": "List notifications for the current user.",
    "auth": "any",
    "query": {
      "unread": "1",
      "limit": 20,
      "offset": 0
    },
    "response": [
      {
        "id": "uuid",
        "type": "service_updated",
        "title": "Service Updated",
        "body": "Customer Portal was updated by Alice Admin",
        "entityType": "service",
        "entityId": "uuid",
        "read": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  {
    "category": "Notifications",
    "method": "POST",
    "path": "/api/notifications",
    "description": "Create a notification (typically triggered automatically by audit events).",
    "auth": "admin",
    "body": {
      "userId": "uuid",
      "type": "service_created",
      "title": "New Service",
      "body": "Payment Gateway was created",
      "entityType": "service",
      "entityId": "uuid"
    },
    "response": {
      "id": "uuid",
      "type": "service_created",
      "title": "New Service"
    }
  },
  {
    "category": "Notifications",
    "method": "PATCH",
    "path": "/api/notifications/{id}/read",
    "description": "Mark a single notification as read.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "read": true
    }
  },
  {
    "category": "Notifications",
    "method": "POST",
    "path": "/api/notifications/read-all",
    "description": "Mark all notifications as read for the current user.",
    "auth": "any",
    "response": {
      "message": "All notifications marked as read",
      "count": 5
    }
  },
  {
    "category": "Portal",
    "method": "GET",
    "path": "/api/portal/overview",
    "description": "Get entity counts for the dashboard.",
    "auth": "any",
    "response": {
      "services": 12,
      "applications": 8,
      "cis": 12,
      "assets": 20,
      "teams": 5,
      "locations": 9,
      "relationships": 90,
      "imports": 0,
      "users": 6,
      "roles": 3
    }
  },
  {
    "category": "Portal",
    "method": "GET",
    "path": "/api/portal/overview/trends",
    "description": "Get aggregated trends for dashboard charts (distribution, monthly activity, service type breakdown).",
    "auth": "any",
    "response": {
      "distribution": [
        {
          "name": "Services",
          "value": 12,
          "color": "#003d7a"
        }
      ],
      "monthlyActivity": [
        {
          "month": "2024-06",
          "activities": 15
        }
      ],
      "serviceTypeBreakdown": [
        {
          "name": "Business",
          "value": 6,
          "color": "#003d7a"
  },
  {
    "category": "Configuration Items",
    "method": "GET",
    "path": "/api/cis/{id}/rack-placements",
    "description": "List all CIs placed in a rack. Returns placements with CI names/types, ordered top-to-bottom (descending startU).",
    "auth": "any",
    "response": {
      "data": [
        {
          "id": "uuid",
          "rackId": "uuid",
          "ciId": "uuid",
          "ciName": "web-01.example.com",
          "ciType": "server",
          "ciSerial": "SN-2024-0001",
          "startU": 38,
          "occupiedUs": 2,
          "position": "front",
          "label": "Web Node 1"
        }
      ]
    }
  },
  {
    "category": "Configuration Items",
    "method": "POST",
    "path": "/api/cis/{id}/rack-placements",
    "description": "Place a CI in a rack slot. Validates: rack is ciType=rack, CI exists, startU >= 1, placement fits within rackSize, no slot overlaps. Auto-creates hosted_on relationship.",
    "auth": "editor+",
    "body": {
      "ciId": "uuid",
      "startU": 38,
      "occupiedUs": 2,
      "position": "front",
      "label": "Web Node 1"
    },
    "response": {
      "id": "uuid",
      "rackId": "uuid",
      "ciId": "uuid",
      "startU": 38,
      "occupiedUs": 2,
      "position": "front",
      "label": "Web Node 1"
    }
  },
  {
    "category": "Configuration Items",
    "method": "PATCH",
    "path": "/api/cis/{id}/rack-placements/{placementId}",
    "description": "Update a rack placement (startU, occupiedUs, position, label). Re-validates slot overlap.",
    "auth": "editor+",
    "body": {
      "startU": 36,
      "occupiedUs": 1
    },
    "response": {
      "id": "uuid",
      "startU": 36,
      "occupiedUs": 1
    }
  },
  {
    "category": "Configuration Items",
    "method": "DELETE",
    "path": "/api/cis/{id}/rack-placements/{placementId}",
    "description": "Remove a CI from a rack. Also deletes the corresponding hosted_on relationship.",
    "auth": "editor+",
    "response": {
      "message": "Placement removed"
    }
  },
  {
          "name": "Technical",
          "value": 6,
          "color": "#4d8cc7"
        }
      ]
    }
  },
  {
    "category": "Portal",
    "method": "GET",
    "path": "/api/portal/recent",
    "description": "Get recently updated items across all entity types.",
    "auth": "any",
    "query": {
      "limit": 10
    },
    "response": [
      {
        "entityType": "service",
        "id": "uuid",
        "name": "Payment Gateway",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  {
    "category": "Portal",
    "method": "GET",
    "path": "/api/portal/suggest",
    "description": "Get autocomplete suggestions across entities.",
    "auth": "any",
    "query": {
      "q": "pay",
      "limit": 5,
      "type": "service|application|ci"
    },
    "response": [
      {
        "entityType": "service",
        "id": "uuid",
        "name": "Payment Gateway",
        "label": "Payment Gateway (Service)"
      }
    ]
  },
  {
    "category": "Relationships",
    "method": "GET",
    "path": "/api/entities/{type}/{id}/relationships",
    "description": "Get all relationships for a specific entity by type and ID.",
    "auth": "any",
    "response": [
      {
        "id": "uuid",
        "sourceType": "service",
        "sourceId": "uuid",
        "relationshipType": "depends_on",
        "targetType": "application",
        "targetId": "uuid",
        "targetName": "CRM System",
        "direction": "outbound"
      }
    ]
  },
  {
    "category": "Relationships",
    "method": "GET",
    "path": "/api/relationships",
    "description": "List all relationships with optional source/target type filters.",
    "auth": "any",
    "query": {
      "sourceType": "service",
      "targetType": "application",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "sourceType": "service",
          "sourceId": "uuid",
          "relationshipType": "depends_on",
          "targetType": "application",
          "targetId": "uuid",
          "direction": "outbound",
          "sourceName": "Payment Gateway",
          "targetName": "CRM System"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Relationships",
    "method": "POST",
    "path": "/api/relationships",
    "description": "Create a relationship between two entities.",
    "auth": "editor+",
    "body": {
      "sourceType": "service",
      "sourceId": "uuid",
      "relationshipType": "depends_on",
      "targetType": "application",
      "targetId": "uuid",
      "direction": "outbound",
      "description": "Service depends on application"
    },
    "response": {
      "id": "uuid",
      "sourceType": "service",
      "relationshipType": "depends_on",
      "targetType": "application"
    }
  },
  {
    "category": "Relationships",
    "method": "GET",
    "path": "/api/relationships/{id}",
    "description": "Get a single relationship.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "sourceType": "service",
      "sourceId": "uuid",
      "relationshipType": "depends_on",
      "targetType": "application",
      "targetId": "uuid",
      "direction": "outbound",
      "description": "Service depends on application",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "category": "Relationships",
    "method": "PATCH",
    "path": "/api/relationships/{id}",
    "description": "Update a relationship.",
    "auth": "editor+",
    "body": {
      "relationshipType": "connects_to",
      "description": "Updated description"
    },
    "response": {
      "id": "uuid",
      "relationshipType": "connects_to",
      "description": "Updated description"
    }
  },
  {
    "category": "Relationships",
    "method": "DELETE",
    "path": "/api/relationships/{id}",
    "description": "Delete a relationship.",
    "auth": "admin",
    "response": {
      "message": "Relationship deleted"
    }
  },
  {
    "category": "Roles",
    "method": "GET",
    "path": "/api/roles",
    "description": "List all roles.",
    "auth": "admin",
    "query": {
      "limit": 20,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "admin",
          "description": "Full system access"
        }
      ],
      "total": 3
    }
  },
  {
    "category": "Roles",
    "method": "POST",
    "path": "/api/roles",
    "description": "Create a new role.",
    "auth": "admin",
    "body": {
      "name": "auditor",
      "description": "Read-only audit access"
    },
    "response": {
      "id": "uuid",
      "name": "auditor",
      "description": "Read-only audit access"
    }
  },
  {
    "category": "Roles",
    "method": "PATCH",
    "path": "/api/roles/{id}",
    "description": "Update a role.",
    "auth": "admin",
    "body": {
      "description": "Updated description"
    },
    "response": {
      "id": "uuid",
      "name": "admin",
      "description": "Updated description"
    }
  },
  {
    "category": "Roles",
    "method": "DELETE",
    "path": "/api/roles/{id}",
    "description": "Delete a role.",
    "auth": "admin",
    "response": {
      "message": "Role deleted"
    }
  },
  {
    "category": "Roles",
    "method": "GET",
    "path": "/api/roles/{id}",
    "description": "Get a single role by ID.",
    "auth": "admin",
    "response": {
      "id": "uuid",
      "name": "admin",
      "description": "Full system access"
    }
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/Groups",
    "description": "List SCIM groups with optional filter.",
    "auth": "SCIM Bearer Token",
    "query": {
      "filter": "displayName eq \"admin\"",
      "startIndex": 1,
      "count": 20
    },
    "response": {
      "schemas": [
        "urn:ietf:params:scim:api:messages:2.0:ListResponse"
      ],
      "totalResults": 1,
      "Resources": [
        {
          "id": "uuid",
          "displayName": "admin",
          "members": [
            {
              "value": "user-uuid",
              "display": "Alice Admin"
            }
          ],
          "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:Group"
          ]
        }
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "POST",
    "path": "/api/scim/v2/Groups",
    "description": "Create a SCIM group. Creates corresponding atlas role.",
    "auth": "SCIM Bearer Token",
    "body": {
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:Group"
      ],
      "displayName": "auditor",
      "members": [
        {
          "value": "user-uuid"
        }
      ]
    },
    "response": {
      "id": "uuid",
      "displayName": "auditor",
      "members": [
        {
          "value": "user-uuid"
        }
      ],
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:Group"
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/Groups/{id}",
    "description": "Get a single SCIM group by ID.",
    "auth": "SCIM Bearer Token",
    "response": {
      "id": "uuid",
      "displayName": "admin",
      "members": [
        {
          "value": "user-uuid",
          "display": "Alice Admin"
        }
      ],
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:Group"
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "PUT",
    "path": "/api/scim/v2/Groups/{id}",
    "description": "Replace a SCIM group (syncs members via user_roles).",
    "auth": "SCIM Bearer Token",
    "body": {
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:Group"
      ],
      "displayName": "admin",
      "members": [
        {
          "value": "user-uuid"
        }
      ]
    },
    "response": {
      "id": "uuid",
      "displayName": "admin",
      "members": [
        {
          "value": "user-uuid"
        }
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "PATCH",
    "path": "/api/scim/v2/Groups/{id}",
    "description": "Partially update a SCIM group — add or remove members.",
    "auth": "SCIM Bearer Token",
    "body": {
      "schemas": [
        "urn:ietf:params:scim:api:messages:2.0:PatchOp"
      ],
      "Operations": [
        {
          "op": "add",
          "path": "members",
          "value": [
            {
              "value": "user-uuid"
            }
          ]
        }
      ]
    },
    "response": {
      "id": "uuid",
      "displayName": "admin",
      "members": [
        {
          "value": "user-uuid"
        }
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "DELETE",
    "path": "/api/scim/v2/Groups/{id}",
    "description": "Delete a SCIM group (deletes the corresponding atlas role).",
    "auth": "SCIM Bearer Token",
    "response": null
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/ResourceTypes",
    "description": "SCIM resource types (RFC 7644 discovery).",
    "auth": "SCIM Bearer Token",
    "response": [
      {
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse"
        ],
        "Resources": [
          {
            "id": "User",
            "name": "User",
            "endpoint": "/scim/v2/Users",
            "schema": "urn:ietf:params:scim:schemas:core:2.0:User"
          }
        ]
      }
    ]
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/Schemas",
    "description": "SCIM schema definitions (RFC 7644 discovery).",
    "auth": "SCIM Bearer Token",
    "response": [
      {
        "id": "urn:ietf:params:scim:schemas:core:2.0:User",
        "name": "User",
        "attributes": [
          {
            "name": "userName",
            "type": "string"
          }
        ]
      }
    ]
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/ServiceProviderConfig",
    "description": "SCIM service provider configuration (RFC 7644 discovery).",
    "auth": "SCIM Bearer Token",
    "response": {
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"
      ],
      "patch": {
        "supported": true
      },
      "bulk": {
        "supported": false
      },
      "filter": {
        "supported": true
      }
    }
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/Users",
    "description": "List SCIM users with optional filter and pagination.",
    "auth": "SCIM Bearer Token",
    "query": {
      "filter": "userName eq \"alice@atlas.local\"",
      "startIndex": 1,
      "count": 20
    },
    "response": {
      "schemas": [
        "urn:ietf:params:scim:api:messages:2.0:ListResponse"
      ],
      "totalResults": 1,
      "Resources": [
        {
          "id": "uuid",
          "userName": "alice@atlas.local",
          "displayName": "Alice Admin",
          "active": true,
          "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User"
          ]
        }
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "POST",
    "path": "/api/scim/v2/Users",
    "description": "Create a SCIM user. Creates corresponding atlas user with role assignments.",
    "auth": "SCIM Bearer Token",
    "body": {
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:User"
      ],
      "userName": "new@atlas.local",
      "name": {
        "givenName": "New",
        "familyName": "User"
      },
      "emails": [
        {
          "value": "new@atlas.local"
        }
      ],
      "active": true
    },
    "response": {
      "id": "uuid",
      "userName": "new@atlas.local",
      "displayName": "New User",
      "active": true,
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:User"
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "GET",
    "path": "/api/scim/v2/Users/{id}",
    "description": "Get a single SCIM user by ID.",
    "auth": "SCIM Bearer Token",
    "response": {
      "id": "uuid",
      "userName": "alice@atlas.local",
      "displayName": "Alice Admin",
      "active": true,
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:User"
      ]
    }
  },
  {
    "category": "SCIM",
    "method": "PUT",
    "path": "/api/scim/v2/Users/{id}",
    "description": "Replace a SCIM user (full update).",
    "auth": "SCIM Bearer Token",
    "body": {
      "schemas": [
        "urn:ietf:params:scim:schemas:core:2.0:User"
      ],
      "userName": "alice@atlas.local",
      "displayName": "Alice Updated",
      "active": true
    },
    "response": {
      "id": "uuid",
      "userName": "alice@atlas.local",
      "displayName": "Alice Updated",
      "active": true
    }
  },
  {
    "category": "SCIM",
    "method": "PATCH",
    "path": "/api/scim/v2/Users/{id}",
    "description": "Partially update a SCIM user using RFC 7644 Update Operations.",
    "auth": "SCIM Bearer Token",
    "body": {
      "schemas": [
        "urn:ietf:params:scim:api:messages:2.0:PatchOp"
      ],
      "Operations": [
        {
          "op": "replace",
          "path": "active",
          "value": false
        }
      ]
    },
    "response": {
      "id": "uuid",
      "userName": "alice@atlas.local",
      "active": false
    }
  },
  {
    "category": "SCIM",
    "method": "DELETE",
    "path": "/api/scim/v2/Users/{id}",
    "description": "Deactivate a SCIM user (soft delete — sets status to inactive).",
    "auth": "SCIM Bearer Token",
    "response": null
  },
  {
    "category": "Search",
    "method": "GET",
    "path": "/api/search",
    "description": "Search across services, applications, and CIs.",
    "auth": "any",
    "query": {
      "q": "payment",
      "entityType": "service",
      "limit": 20,
      "offset": 0
    },
    "response": {
      "data": [
        {
          "entityType": "service",
          "id": "uuid",
          "name": "Payment Gateway",
          "description": "Handles payments",
          "route": "/portal/services/uuid"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Services",
    "method": "GET",
    "path": "/api/services",
    "description": "List all services with business/technical type detection.",
    "auth": "any",
    "query": {
      "search": "Payment",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "Payment Gateway",
          "lifecycleStatus": "production",
          "ownerTeamName": "Engineering",
          "businessServiceId": "uuid",
          "environment": "production"
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Services",
    "method": "POST",
    "path": "/api/services",
    "description": "Create a service. Include `businessServiceId` for business services or `protocol`/`port` for technical.",
    "auth": "editor+",
    "body": {
      "name": "New Service",
      "description": "A service",
      "ownerTeamId": "uuid",
      "lifecycleStatus": "active",
      "environment": "production",
      "classification": "internal",
      "serviceCategory": "business",
      "businessServiceId": "uuid"
    },
    "response": {
      "id": "uuid",
      "name": "New Service",
      "lifecycleStatus": "active",
      "ownerTeamName": "Engineering"
    }
  },
  {
    "category": "Services",
    "method": "GET",
    "path": "/api/services/{id}",
    "description": "Get a single service with type-specific fields.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "Payment Gateway",
      "description": "Handles payments",
      "lifecycleStatus": "production",
      "ownerTeamName": "Engineering",
      "businessServiceId": "uuid",
      "environment": "production",
      "classification": "internal",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "category": "Services",
    "method": "PATCH",
    "path": "/api/services/{id}",
    "description": "Update a service. Fields updated in base and child tables.",
    "auth": "editor+",
    "body": {
      "name": "Updated Name",
      "environment": "staging"
    },
    "response": {
      "id": "uuid",
      "name": "Updated Name",
      "lifecycleStatus": "production",
      "ownerTeamName": "Engineering",
      "environment": "staging"
    }
  },
  {
    "category": "Services",
    "method": "DELETE",
    "path": "/api/services/{id}",
    "description": "Delete a service (cascades to child table).",
    "auth": "admin",
    "response": {
      "message": "Service deleted"
    }
  },
  {
    "category": "Teams",
    "method": "GET",
    "path": "/api/teams",
    "description": "List all teams with assigned role name.",
    "auth": "any",
    "query": {
      "search": "engineering",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "Engineering",
          "type": "delivery",
          "ownershipScope": "global",
          "status": "active",
          "roleName": "editor",
          "memberCount": 5
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Teams",
    "method": "POST",
    "path": "/api/teams",
    "description": "Create a team.",
    "auth": "admin",
    "body": {
      "name": "Platform",
      "type": "delivery",
      "ownershipScope": "global",
      "status": "active",
      "roleId": "uuid",
      "description": "Platform engineering"
    },
    "response": {
      "id": "uuid",
      "name": "Platform",
      "type": "delivery",
      "status": "active"
    }
  },
  {
    "category": "Teams",
    "method": "GET",
    "path": "/api/teams/{id}",
    "description": "Get a single team with members.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "Engineering",
      "type": "delivery",
      "ownershipScope": "global",
      "status": "active",
      "roleName": "editor",
      "description": "Core engineering team",
      "members": [
        {
          "userId": "uuid",
          "displayName": "Bob Editor",
          "email": "bob@atlas.local",
          "memberRole": "member"
        }
      ]
    }
  },
  {
    "category": "Teams",
    "method": "PATCH",
    "path": "/api/teams/{id}",
    "description": "Update a team.",
    "auth": "admin",
    "body": {
      "name": "Platform Engineering",
      "status": "inactive"
    },
    "response": {
      "id": "uuid",
      "name": "Platform Engineering",
      "status": "inactive"
    }
  },
  {
    "category": "Teams",
    "method": "DELETE",
    "path": "/api/teams/{id}",
    "description": "Delete a team.",
    "auth": "admin",
    "response": {
      "message": "Team deleted"
    }
  },
  {
    "category": "Teams",
    "method": "GET",
    "path": "/api/teams/{id}/members",
    "description": "List members of a team.",
    "auth": "any",
    "response": [
      {
        "userId": "uuid",
        "displayName": "Bob Editor",
        "email": "bob@atlas.local",
        "memberRole": "member"
      }
    ]
  },
  {
    "category": "Teams",
    "method": "POST",
    "path": "/api/teams/{id}/members",
    "description": "Add a member to a team.",
    "auth": "admin",
    "body": {
      "userId": "uuid",
      "memberRole": "member"
    },
    "response": {
      "message": "Member added"
    }
  },
  {
    "category": "Teams",
    "method": "DELETE",
    "path": "/api/teams/{id}/members/{memberId}",
    "description": "Remove a member from a team.",
    "auth": "admin",
    "response": {
      "message": "Member removed"
    }
  },
  {
    "category": "Themes",
    "method": "GET",
    "path": "/api/themes",
    "description": "List all themes.",
    "auth": "any",
    "response": {
      "data": [
        {
          "id": "uuid",
          "name": "Default Light",
          "isActive": true,
          "isDefault": true,
          "description": "Default light theme"
        }
      ],
      "total": 1
    },
    "query": {
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    }
  },
  {
    "category": "Themes",
    "method": "POST",
    "path": "/api/themes",
    "description": "Create a new theme.",
    "auth": "admin",
    "body": {
      "name": "Dark Blue",
      "description": "Custom dark theme",
      "tokens": {
        "--primary": "#1a73e8",
        "--background": "#0d1117"
      },
      "isDefault": false
    },
    "response": {
      "id": "uuid",
      "name": "Dark Blue",
      "isActive": false,
      "isDefault": false
    }
  },
  {
    "category": "Themes",
    "method": "GET",
    "path": "/api/themes/{id}",
    "description": "Get a single theme with tokens.",
    "auth": "any",
    "response": {
      "id": "uuid",
      "name": "Default Light",
      "description": "Default light theme",
      "tokens": {
        "--primary": "#003d7a"
      },
      "isActive": true,
      "isDefault": true
    }
  },
  {
    "category": "Themes",
    "method": "PATCH",
    "path": "/api/themes/{id}",
    "description": "Update a theme.",
    "auth": "admin",
    "body": {
      "tokens": {
        "--primary": "#004d9a"
      }
    },
    "response": {
      "id": "uuid",
      "name": "Default Light",
      "tokens": {
        "--primary": "#004d9a"
      }
    }
  },
  {
    "category": "Themes",
    "method": "DELETE",
    "path": "/api/themes/{id}",
    "description": "Delete a theme.",
    "auth": "admin",
    "response": {
      "message": "Theme deleted"
    }
  },
  {
    "category": "Themes",
    "method": "POST",
    "path": "/api/themes/{id}/activate",
    "description": "Activate a theme for the current user.",
    "auth": "any",
    "response": {
      "message": "Theme activated"
    }
  },
  {
    "category": "User Preferences",
    "method": "GET",
    "path": "/api/me/theme",
    "description": "Get the current user theme and locale preferences.",
    "auth": "any",
    "response": {
      "modePreference": "dark",
      "themeId": "uuid",
      "timezone": "Europe/Copenhagen",
      "clockFormat": "24h",
      "dateFormat": "DD/MM/YYYY"
    }
  },
  {
    "category": "User Preferences",
    "method": "PUT",
    "path": "/api/me/theme",
    "description": "Set the user theme and locale preferences.",
    "auth": "any",
    "body": {
      "modePreference": "dark",
      "timezone": "America/New_York",
      "clockFormat": "12h",
      "dateFormat": "MM/DD/YYYY"
    },
    "response": {
      "modePreference": "dark",
      "timezone": "America/New_York",
      "clockFormat": "12h",
      "dateFormat": "MM/DD/YYYY"
    }
  },
  {
    "category": "Users",
    "method": "GET",
    "path": "/api/users",
    "description": "List all users with their assigned roles and manager.",
    "auth": "admin",
    "query": {
      "search": "alice",
      "limit": 20,
      "offset": 0,
      "sort": "(any column name)",
      "order": "asc|desc",
      "filter": "[{\"field\":\"column\",\"op\":\"eq|neq|contains|startsWith|isEmpty\",\"value\":\"value\"}]"
    },
    "response": {
      "data": [
        {
          "id": "uuid",
          "email": "alice@atlas.local",
          "displayName": "Alice Admin",
          "status": "active",
          "roleNames": [
            "admin"
          ],
          "managerName": null,
          "mfaEnabled": false
        }
      ],
      "total": 1
    }
  },
  {
    "category": "Users",
    "method": "POST",
    "path": "/api/users",
    "description": "Create a new user.",
    "auth": "admin",
    "body": {
      "email": "newuser@atlas.local",
      "displayName": "New User",
      "password": "secure-pass",
      "status": "active",
      "roleIds": [
        "uuid"
      ],
      "managerId": "uuid"
    },
    "response": {
      "id": "uuid",
      "email": "newuser@atlas.local",
      "displayName": "New User",
      "status": "active"
    }
  },
  {
    "category": "Users",
    "method": "GET",
    "path": "/api/users/{id}",
    "description": "Get a single user with roles.",
    "auth": "admin",
    "response": {
      "id": "uuid",
      "email": "alice@atlas.local",
      "displayName": "Alice Admin",
      "status": "active",
      "roles": [
        {
          "id": "uuid",
          "name": "admin"
        }
      ],
      "mfaEnabled": false
    }
  },
  {
    "category": "Users",
    "method": "PATCH",
    "path": "/api/users/{id}",
    "description": "Update a user.",
    "auth": "admin",
    "body": {
      "displayName": "Alice Updated",
      "status": "inactive"
    },
    "response": {
      "id": "uuid",
      "displayName": "Alice Updated",
      "status": "inactive"
    }
  },
  {
    "category": "Users",
    "method": "DELETE",
    "path": "/api/users/{id}",
    "description": "Delete a user.",
    "auth": "admin",
    "response": {
      "message": "User deleted"
    }
  },
  {
    "category": "Users",
    "method": "PUT",
    "path": "/api/users/{id}/roles",
    "description": "Sync user roles (replaces all existing role assignments).",
    "auth": "admin",
    "body": {
      "roleIds": [
        "uuid-admin",
        "uuid-editor"
      ]
    },
    "response": {
      "message": "Roles updated",
      "roleIds": [
        "uuid-admin",
        "uuid-editor"
      ]
    }
  }
];

export default endpoints;
