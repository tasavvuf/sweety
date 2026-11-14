import express from "express";
import { z } from "zod";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
const slots = ["Morning", "After breakfast", "After lunch", "After dinner"];

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function todayAsCalendarDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const readingDateSchema = z
  .string()
  .refine(isCalendarDate, "Reading date must be a valid YYYY-MM-DD date")
  .refine(
    (value) => !isCalendarDate(value) || value <= todayAsCalendarDate(),
    "Reading date cannot be in the future",
  );

const readingSchema = z.object({
  reading_date: readingDateSchema,
  slot: z.enum(slots),
  value_mg_dl: z.number().int().min(40).max(600),
});

const readingIdSchema = z.object({ id: z.uuid("Invalid reading ID") });
const readingFiltersSchema = z.object({
  slot: z.enum(slots).optional(),
  from: z
    .string()
    .refine(isCalendarDate, "From date must be a valid YYYY-MM-DD date")
    .optional(),
  to: z
    .string()
    .refine(isCalendarDate, "To date must be a valid YYYY-MM-DD date")
    .optional(),
});

function validationError(res, parsed) {
  return res.status(400).json({
    success: false,
    message: "Invalid reading details",
    errors: parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function handleDatabaseError(error, res, slot) {
  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: `You already have an ${slot} reading for this date.`,
    });
  }

  console.error("Reading request failed:", error);
  return res
    .status(500)
    .json({ success: false, message: "Unable to process the reading" });
}

router.use(requireAuth);

router.post("/", async (req, res) => {
  const parsed = readingSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { reading_date, slot, value_mg_dl } = parsed.data;
    const result = await pool.query(
      `INSERT INTO glucose_readings (user_id, reading_date, slot, value_mg_dl)
			 VALUES ($1, $2, $3, $4)
			 RETURNING *`,
      [req.auth.userId, reading_date, slot, value_mg_dl],
    );

    return res.status(201).json({ success: true, reading: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(error, res, parsed.data.slot);
  }
});

router.get("/", async (req, res) => {
  const filters = readingFiltersSchema.safeParse(req.query);
  if (!filters.success) return validationError(res, filters);

  const page = positiveInteger(req.query.page, 1);
  const limit = Math.min(50, positiveInteger(req.query.limit, 10));
  const offset = (page - 1) * limit;
  const conditions = ["user_id = $1"];
  const values = [req.auth.userId];

  if (filters.data.slot) {
    values.push(filters.data.slot);
    conditions.push(`slot = $${values.length}`);
  }
  if (filters.data.from) {
    values.push(filters.data.from);
    conditions.push(`reading_date >= $${values.length}::date`);
  }
  if (filters.data.to) {
    values.push(filters.data.to);
    conditions.push(`reading_date <= $${values.length}::date`);
  }
  if (
    filters.data.from &&
    filters.data.to &&
    filters.data.from > filters.data.to
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message: "From date must be before or equal to to date",
      });
  }

  const where = conditions.join(" AND ");

  try {
    const [countResult, readingsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_records FROM glucose_readings WHERE ${where}`,
        values,
      ),
      pool.query(
        `SELECT * FROM glucose_readings
         WHERE ${where}
         ORDER BY reading_date DESC, created_at DESC, id DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset],
      ),
    ]);

    const totalRecords = countResult.rows[0].total_records;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      readings: readingsResult.rows,
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return handleDatabaseError(error, res);
  }
});

router.get("/:id", async (req, res) => {
  const id = readingIdSchema.safeParse(req.params);
  if (!id.success) return validationError(res, id);

  try {
    const result = await pool.query(
      "SELECT * FROM glucose_readings WHERE id = $1 AND user_id = $2",
      [id.data.id, req.auth.userId],
    );

    if (!result.rows[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Reading not found" });
    }

    return res.status(200).json({ success: true, reading: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(error, res);
  }
});
router.put("/:id", async (req, res) => {
  const id = readingIdSchema.safeParse(req.params);
  const parsed = readingSchema.safeParse(req.body ?? {});
  if (!id.success) return validationError(res, id);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { reading_date, slot, value_mg_dl } = parsed.data;
    const result = await pool.query(
      `UPDATE glucose_readings
			 SET reading_date = $1, slot = $2, value_mg_dl = $3, updated_at = NOW()
			 WHERE id = $4 AND user_id = $5
			 RETURNING *`,
      [reading_date, slot, value_mg_dl, id.data.id, req.auth.userId],
    );

    if (!result.rows[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Reading not found" });
    }

    return res.status(200).json({ success: true, reading: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(error, res, parsed.data.slot);
  }
});

router.delete("/:id", async (req, res) => {
  const id = readingIdSchema.safeParse(req.params);
  if (!id.success) return validationError(res, id);

  try {
    const result = await pool.query(
      `DELETE FROM glucose_readings
			 WHERE id = $1 AND user_id = $2
			 RETURNING *`,
      [id.data.id, req.auth.userId],
    );

    if (!result.rows[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Reading not found" });
    }

    return res.status(200).json({ success: true, reading: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(error, res);
  }
});

export default router;
