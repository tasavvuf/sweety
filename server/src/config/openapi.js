const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
};

const readingRequest = {
  type: "object",
  required: ["reading_date", "slot", "value_mg_dl"],
  properties: {
    reading_date: { type: "string", format: "date", example: "2026-11-13" },
    slot: {
      type: "string",
      enum: ["Morning", "After breakfast", "After lunch", "After dinner"],
    },
    value_mg_dl: { type: "integer", minimum: 40, maximum: 600, example: 120 },
  },
};

const readingId = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Sweety API",
    version: "1.0.0",
    description: "API documentation for glucose readings and authentication.",
  },
  paths: {
    "/": {
      get: {
        summary: "Welcome message",
        responses: { 200: { description: "Server welcome message" } },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        responses: { 200: { description: "API is running" } },
      },
    },
    "/api/auth/reg": {
      post: {
        summary: "Create an account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: { description: "Account created and authentication cookie set" },
          400: {
            description: "Invalid registration details",
            content: { "application/json": { schema: errorResponse } },
          },
          409: {
            description: "Email already exists",
            content: { "application/json": { schema: errorResponse } },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Logged in and authentication cookie set" },
          401: {
            description: "Invalid email or password",
            content: { "application/json": { schema: errorResponse } },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get the current user",
        security: [{ authCookie: [] }],
        responses: {
          200: { description: "Current user" },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Log out",
        security: [{ authCookie: [] }],
        responses: {
          200: { description: "Logged out" },
          401: { description: "Not authenticated" },
        },
      },
    },
    "/api/readings": {
      get: {
        summary: "Get readings",
        security: [{ authCookie: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          { name: "slot", in: "query", schema: { type: "string", enum: ["Morning", "After breakfast", "After lunch", "After dinner"] } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: { description: "Paginated readings for the authenticated user" },
          401: { description: "Not authenticated" },
        },
      },
      post: {
        summary: "Add a reading",
        security: [{ authCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReadingRequest" },
            },
          },
        },
        responses: {
          201: { description: "Reading created" },
          400: {
            description: "Invalid reading details",
            content: { "application/json": { schema: errorResponse } },
          },
          401: { description: "Not authenticated" },
          409: {
            description: "Reading already exists for this slot and date",
            content: { "application/json": { schema: errorResponse } },
          },
        },
      },
    },
    "/api/readings/{id}": {
      get: {
        summary: "Get one reading",
        security: [{ authCookie: [] }],
        parameters: [readingId],
        responses: {
          200: { description: "Reading" },
          401: { description: "Not authenticated" },
          404: { description: "Reading not found" },
        },
      },
      put: {
        summary: "Update a reading",
        security: [{ authCookie: [] }],
        parameters: [readingId],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReadingRequest" },
            },
          },
        },
        responses: {
          200: { description: "Reading updated" },
          400: { description: "Invalid reading details" },
          401: { description: "Not authenticated" },
          404: { description: "Reading not found" },
          409: { description: "Duplicate slot and date" },
        },
      },
      delete: {
        summary: "Delete a reading",
        security: [{ authCookie: [] }],
        parameters: [readingId],
        responses: {
          200: { description: "Reading deleted" },
          401: { description: "Not authenticated" },
          404: { description: "Reading not found" },
        },
      },
    },
    "/api/reports/daily": {
      get: {
        summary: "Get daily report",
        security: [{ authCookie: [] }],
        parameters: [{ name: "date", in: "query", required: true, schema: { type: "string", format: "date", example: "2026-11-13" } }],
        responses: { 200: { description: "Daily summary and readings" }, 400: { description: "Invalid date" }, 401: { description: "Not authenticated" } },
      },
    },
    "/api/reports/month-to-date": {
      get: {
        summary: "Get month-to-date report",
        security: [{ authCookie: [] }],
        parameters: [{ name: "date", in: "query", required: true, schema: { type: "string", format: "date", example: "2026-11-13" } }],
        responses: { 200: { description: "Month summary through the selected date" }, 400: { description: "Invalid date" }, 401: { description: "Not authenticated" } },
      },
    },
    "/api/reports/previous-month": {
      get: {
        summary: "Get previous-month report",
        security: [{ authCookie: [] }],
        parameters: [{ name: "date", in: "query", required: true, schema: { type: "string", format: "date", example: "2026-11-13" } }],
        responses: { 200: { description: "Complete month before the selected date" }, 400: { description: "Invalid date" }, 401: { description: "Not authenticated" } },
      },
    },
    "/api/analytics/daily": {
      get: {
        summary: "Get daily glucose trend",
        security: [{ authCookie: [] }],
        parameters: [{ name: "date", in: "query", required: true, schema: { type: "string", format: "date" } }],
        responses: { 200: { description: "Readings ordered by daily slot" }, 400: { description: "Invalid date" }, 401: { description: "Not authenticated" } },
      },
    },
    "/api/analytics/monthly": {
      get: {
        summary: "Get month-to-date daily averages",
        security: [{ authCookie: [] }],
        parameters: [{ name: "date", in: "query", required: true, schema: { type: "string", format: "date" } }],
        responses: { 200: { description: "Daily aggregates for the selected month" }, 400: { description: "Invalid date" }, 401: { description: "Not authenticated" } },
      },
    },
    "/api/analytics/distribution": {
      get: {
        summary: "Get glucose reading distribution",
        security: [{ authCookie: [] }],
        parameters: [
          { name: "from", in: "query", required: true, schema: { type: "string", format: "date" } },
          { name: "to", in: "query", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: { 200: { description: "Server-aggregated glucose range buckets" }, 400: { description: "Invalid date range" }, 401: { description: "Not authenticated" } },
      },
    },
  },
  components: {
    securitySchemes: {
      authCookie: { type: "apiKey", in: "cookie", name: "auth_token" },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Tasavvuf" },
          email: {
            type: "string",
            format: "email",
            example: "tasavvuf@example.com",
          },
          password: { type: "string", format: "password", minLength: 8 , example: "securePassword123"},
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "tasavvuf@example.com",
          },
          password: { type: "string", format: "password", minLength: 8 , example: "securePassword123"	},
        },
      },
      ReadingRequest: readingRequest,
    },
  },
};
