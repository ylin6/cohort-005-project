// PROTOTYPE — throwaway. Mock Notifications per role, drawn from the event
// catalogue in "Which events become Notifications, for whom, on which channel".
// Stands in for Knock's feed until we have an account.
import { UserRole } from "~/db/schema";

export interface MockNotification {
  id: string;
  event: string; // catalogue event name, shown small
  body: string;
  href: string;
  minutesAgo: number;
  read: boolean;
}

const student: MockNotification[] = [
  { id: "s1", event: "Question answered", body: "**Dana Reyes** answered your question in *Intro to TypeScript*: \"Use a discriminated union here…\"", href: "/courses", minutesAgo: 12, read: false },
  { id: "s2", event: "Lesson added", body: "3 new lessons in *Intro to TypeScript*: Generics, Mapped types, Conditional types", href: "/courses", minutesAgo: 95, read: false },
  { id: "s3", event: "Reply", body: "**Sam Okafor** replied to your comment on *Closures*", href: "/courses", minutesAgo: 300, read: true },
  { id: "s4", event: "Refund Request decided", body: "Your Refund Request for *React Basics* was **approved**. Note: \"Sorry it wasn't a fit.\"", href: "/dashboard", minutesAgo: 60 * 26, read: true },
  { id: "s5", event: "Course Archived", body: "*Legacy jQuery* has been Archived. You keep access to what you've completed.", href: "/dashboard", minutesAgo: 60 * 24 * 4, read: true },
];

const teamAdminExtra: MockNotification[] = [
  { id: "t1", event: "Seat claimed", body: "**4 seats** claimed on your *Intro to TypeScript* Team Licence (6 of 10 used)", href: "/team", minutesAgo: 30, read: false },
];

const instructor: MockNotification[] = [
  { id: "i1", event: "Question asked", body: "**Priya Nair** asked a question in *Intro to TypeScript* › *Generics*", href: "/instructor/questions", minutesAgo: 4, read: false },
  { id: "i2", event: "Enrollment created", body: "**12 new Enrollments** in *Intro to TypeScript* today", href: "/instructor", minutesAgo: 40, read: false },
  { id: "i3", event: "Team Licence bought", body: "**Acme Corp** bought a 10-seat Team Licence for *Intro to TypeScript*", href: "/instructor", minutesAgo: 180, read: false },
  { id: "i4", event: "Course rated", body: "**Leo Park** rated *Intro to TypeScript* ★★★★☆", href: "/instructor/analytics", minutesAgo: 60 * 20, read: true },
  { id: "i5", event: "Reply", body: "**Priya Nair** replied to your answer on *Generics*", href: "/instructor/questions", minutesAgo: 60 * 30, read: true },
];

const admin: MockNotification[] = [
  { id: "a1", event: "Refund Request raised", body: "**Jordan Lee** requested a refund for *React Basics* ($49.00)", href: "/admin/refunds", minutesAgo: 8, read: false },
  { id: "a2", event: "Refund Request raised", body: "**Acme Corp** requested a refund for a Team Licence (*Intro to TypeScript*, $390.00)", href: "/admin/refunds", minutesAgo: 140, read: false },
  { id: "a3", event: "Reply", body: "**Priya Nair** replied to your answer on *Generics*", href: "/instructor/questions", minutesAgo: 60 * 50, read: true },
];

export function mockFeedFor(role: UserRole | null, isTeamAdmin: boolean): MockNotification[] {
  if (role === UserRole.Admin) return admin;
  if (role === UserRole.Instructor) return instructor;
  if (role === UserRole.Student) return isTeamAdmin ? [...teamAdminExtra, ...student] : student;
  return [];
}

export function timeAgo(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 60 / 24)}d`;
}
