import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { bookmarks, courses, lessons, modules } from "~/db/schema";

// ─── Bookmarks ───
// A Student's flag on a Lesson, one per Student per Lesson (the unique index
// enforces it). See GLOSSARY.md for the language.
//
// Every function takes the database first, so tests can hand in an in-memory
// one. Callers check content access before calling.

export type Db = BetterSQLite3Database<typeof schema>;

function bookmarkFor(userId: number, lessonId: number) {
  return and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId));
}

export function isBookmarked(db: Db, userId: number, lessonId: number) {
  return !!db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(bookmarkFor(userId, lessonId))
    .get();
}

/**
 * Adds the Bookmark if the Student has none on the Lesson, removes it if they
 * do. Returns whether the Lesson is now bookmarked. A second request racing
 * the first lands on the unique index and is ignored, not thrown.
 */
export function toggleBookmark(
  db: Db,
  userId: number,
  lessonId: number,
  now: Date
): boolean {
  return db.transaction((tx) => {
    const removed = tx
      .delete(bookmarks)
      .where(bookmarkFor(userId, lessonId))
      .returning({ id: bookmarks.id })
      .all();
    if (removed.length > 0) return false;

    tx.insert(bookmarks)
      .values({ userId, lessonId, createdAt: now.toISOString() })
      .onConflictDoNothing()
      .run();
    return true;
  });
}

/** The Student's Bookmarks, newest first, each with its Lesson and Course. */
export function listBookmarksForStudent(db: Db, userId: number) {
  return db
    .select({
      id: bookmarks.id,
      createdAt: bookmarks.createdAt,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      moduleTitle: modules.title,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(bookmarks)
    .innerJoin(lessons, eq(bookmarks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
    .all();
}
