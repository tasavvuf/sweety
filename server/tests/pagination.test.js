import { afterEach, describe, expect, it } from "vitest";
import {
  createUser,
  dateOffset,
  deleteUsers,
  insertReading,
  loginAs,
} from "./helpers.js";

const createdUserIds = [];

afterEach(async () => {
  await deleteUsers(createdUserIds.splice(0));
});

describe("reading pagination", () => {
  it("returns the correct records and metadata on page two", async () => {
    const patient = await createUser("patient");
    createdUserIds.push(patient.id);
    const agent = await loginAs(patient);
    for (let daysAgo = 1; daysAgo <= 12; daysAgo += 1) {
      await insertReading(patient.id, {
        date: dateOffset(daysAgo),
        value: 100 + daysAgo,
      });
    }

    const response = await agent.get("/api/readings?page=2&limit=5");

    expect(response.status).toBe(200);
    expect(
      response.body.readings.map((reading) =>
        reading.reading_date.slice(0, 10),
      ),
    ).toEqual([6, 7, 8, 9, 10].map((daysAgo) => dateOffset(daysAgo)));
    expect(response.body.pagination).toMatchObject({
      currentPage: 2,
      limit: 5,
      totalRecords: 12,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("caps requested page size at fifty records", async () => {
    const patient = await createUser("patient");
    createdUserIds.push(patient.id);
    const agent = await loginAs(patient);
    for (let daysAgo = 1; daysAgo <= 55; daysAgo += 1) {
      await insertReading(patient.id, {
        date: dateOffset(daysAgo),
        value: 100 + (daysAgo % 100),
      });
    }

    const response = await agent.get("/api/readings?page=1&limit=999");

    expect(response.status).toBe(200);
    expect(response.body.readings).toHaveLength(50);
    expect(response.body.pagination).toMatchObject({
      limit: 50,
      totalRecords: 55,
      totalPages: 2,
      hasNextPage: true,
    });
  });
});
