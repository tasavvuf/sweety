# Server integration tests

The API tests use a dedicated PostgreSQL database. They refuse to fall back to `DATABASE_URL` in test mode and reject a test URL with the same host and database name as the configured development URL.

1. Create a separate local database named `sweety_test` (or use another isolated test database).
2. Copy `.env.test.example` to `.env.test` and set `TEST_DATABASE_URL` and a test-only `JWT_SECRET`.
3. From `server/`, apply `../database/schema.sql` to the test database:

   ```sh
   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f ../database/schema.sql
   ```

4. Run the suite with `npm test`.

Test-created users are uniquely named and removed after each test; related readings and doctor-patient links are removed by their foreign-key cascades.