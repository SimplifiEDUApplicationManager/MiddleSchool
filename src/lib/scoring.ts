/* Simplifi EDU — Middle School Mastery screener scoring
 * Ported from Danielle's screener-scoring.js (Nov 12, 2026).
 * scoreParent(answers) and scoreStudent(answers) return structured data. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Answers = Record<string, any>;

interface PartScore {
  n: number;
  title: string;
  total: number;
  answered: number;
  max: number;
  pct: number;
  avatar?: string;
  label?: string;
}

interface TopThreeItem {
  rank: number;
  id: string;
  text: string;
}

export interface ParentResult {
  form: "parent";
  parts: PartScore[];
  lead: PartScore | null;
  topThree: TopThreeItem[];
  flags: string[];
}

export interface StudentResult {
  form: "student";
  parts: PartScore[];
  lead: PartScore | null;
  flags: string[];
}

const PARENT_PARTS: [number, string, string, [string, string][]][] = [
  [1, "Remembering and keeping track", "Holding on to assignments, materials, and the small things that need to happen.", [
    ["1a", "When a teacher announces a quiz or project in class and you find out later that it slipped through the cracks, their response is often, \u201cI didn\u2019t know we had that.\u201d"],
    ["1b", "Does the homework but then leaves it at home, so it never gets turned in."],
    ["1d", "Loses track partway through a task, like forgetting the next step in a multi-step math problem."],
    ["1c", "Needs repeated reminders to do what they\u2019re supposed to do."]]],
  [2, "Sensing and managing time", "Judging how long things take, and noticing time as it passes.", [
    ["2a", "Chronically underestimates how long things take, or is shocked by how late it is when trying to complete a task."],
    ["2b", "Says \u201cI have plenty of time,\u201d then panics right at the deadline."],
    ["2c", "Loses whole afternoons or runs late without noticing the passage of time."]]],
  [3, "Getting started", "Moving from \u201cI should do this\u201d to actually beginning the work.", [
    ["3a", "Sits down to work but can\u2019t get started; the blank page wins."],
    ["3b", "Doesn\u2019t want to sit down and puts off starting (not finishing); big projects sit untouched."],
    ["3c", "Works fine once actually in motion, so the struggle is almost all at the beginning."]]],
  [4, "Sorting what matters most", "Deciding what comes first, and mapping out the steps to get there.", [
    ["4a", "Gets visibly overwhelmed by the sheer volume of work."],
    ["4b", "Does the easy, low-stakes task while an important deadline is ignored."],
    ["4c", "Can\u2019t say what matters most right now; everything feels equally urgent."]]],
  [5, "Keeping things organized", "Papers, supplies, workspaces, and digital files: knowing where things live.", [
    ["5a", "Loose papers get stuffed wherever they fit, so graded work and permission slips are hard to track down."],
    ["5b", "Can\u2019t find what they need when they need it, like a worksheet, a charger, or a file on the computer."],
    ["5c", "Their homework spot gets so cluttered that just getting set up eats into work time."]]],
  [6, "Staying with it", "Keeping attention on a task long enough to finish it.", [
    ["6a", "Drifts off partway through homework, even on work they know how to do."],
    ["6b", "Gets pulled away easily by a phone, a sibling, a noise, or a new idea."],
    ["6c", "Starts strong but leaves a trail of half-finished tasks."]]],
  [7, "Pausing before acting", "Stopping to think before saying, doing, or turning something in.", [
    ["7a", "Rushes through work to be done with it, skipping directions or making careless mistakes."],
    ["7b", "Blurts things out or acts in the moment, then wishes they hadn\u2019t."],
    ["7c", "Makes snap decisions they later regret, like picking a project topic in seconds or saying yes to plans without checking what\u2019s due."]]],
  [8, "Handling big feelings", "Keeping frustration, worry, or disappointment from taking over the work.", [
    ["8a", "A small setback, like a confusing problem or one low quiz grade, sets off a big reaction."],
    ["8b", "Has a hard time hearing feedback or corrections on their work without getting defensive or upset."],
    ["8c", "Takes a long time to settle back down after getting upset."]]],
  [9, "Rolling with changes", "Adjusting when plans change or the first approach isn\u2019t working.", [
    ["9a", "Gets thrown off by surprises in the school day, like a substitute, a moved due date, or a schedule switch."],
    ["9b", "Has trouble switching gears from one subject or activity to the next, like going from math homework to reading."],
    ["9c", "Gets frustrated when a group project means doing things someone else\u2019s way."]]],
  [10, "Sticking with a goal", "Keeping effort going toward something that pays off later.", [
    ["10a", "Talks excitedly about a goal, like raising a grade or making a team, but the effort fades within a week or two."],
    ["10b", "Finds it hard to put in effort today for something that won\u2019t pay off for weeks."],
    ["10c", "Gives up on longer projects when the finish line feels far away."]]],
  [11, "Stepping back to check", "Looking back over work and noticing what is and isn\u2019t working.", [
    ["11a", "Turns work in without looking it over first."],
    ["11b", "Is genuinely surprised by grades, and thought the test or project went fine."],
    ["11c", "Has trouble saying what went wrong, or what they\u2019d try differently next time."]]]
];

const STUDENT_PARTS: [number, string, string, [string, string][], string][] = [
  [1, "Keeping track", "Stuff that\u2019s due, and stuff you need.", [
    ["1", "I find out about a quiz or project later than I should, like \u201cWait, we have a test tomorrow?\u201d"],
    ["2", "I finish my homework but forget to turn it in, or leave it at home."],
    ["3", "My backpack, binder, or Google Drive gets messy enough that I can\u2019t find what I need."]], "The Vanisher"],
  [2, "Time", "How long things take, and how far away they feel.", [
    ["4", "Homework takes way longer than I thought it would."],
    ["5", "I think I have plenty of time, then end up rushing at the last minute."],
    ["6", "It\u2019s hard to keep working on something when the due date is weeks away."]], "The Time Bender"],
  [3, "Getting going", "Starting, and sticking with it.", [
    ["7", "Starting is the hardest part, even when I know how to do the work."],
    ["8", "Once I start, I get distracted (my phone, a noise, something more fun) and it\u2019s hard to get back to it."],
    ["9", "When something feels hard or confusing, I\u2019d rather put it off than start."]], "The Freezer"],
  [4, "Juggling it all", "Lots due at once, and getting it right.", [
    ["10", "When I have a lot due, I\u2019m not sure what to do first."],
    ["11", "I rush through work to be done with it and make careless mistakes."],
    ["12", "I turn things in without checking them over."]], "The Overloaded"]
];

function statementText(parts: [number, string, string, [string, string][], ...unknown[]][]) {
  const map: Record<string, string> = {};
  parts.forEach(p => p[3].forEach(([id, text]) => { map[id] = text; }));
  return map;
}

export function scoreParent(a: Answers): ParentResult {
  const parts: PartScore[] = PARENT_PARTS.map(([n, title, , items]) => {
    const total = items.reduce((sum, [id]) => sum + (a[id] || 0), 0);
    const answered = items.filter(([id]) => a[id]).length;
    const max = items.length * 4;
    return { n, title, total, answered, max, pct: total / max };
  }).sort((x, y) => y.pct - x.pct || x.n - y.n);

  const text = statementText(PARENT_PARTS);
  const topThree: TopThreeItem[] = (a.top3 || []).map((id: string, i: number) => ({ rank: i + 1, id, text: text[id] }));

  const flags: string[] = [];
  if (["Yes", "Sometimes"].includes(a.f_strong)) flags.push("Steady first: schoolwork brings up strong feelings (" + a.f_strong.toLowerCase() + ").");
  if (["3 to 5", "6 or more"].includes(a.d_miss)) flags.push("Missing or late work: " + a.d_miss + ".");
  if (["A little better than it really is", "A lot better than it really is"].includes(a.d_rosy)) flags.push("Child says school is going " + a.d_rosy.toLowerCase() + ".");
  const grades = (Array.isArray(a.d_grades) ? a.d_grades : []).filter((r: { c: string; g: string }) => r.c || r.g);
  if (grades.length) flags.push("Current grades: " + grades.map((r: { c: string; g: string }) => (r.c || "Class") + " " + (r.g || "?")).join(", ") + ".");
  if ((a.d_pull || []).length) flags.push("Grades pulled down by: " + a.d_pull.join(", ") + ".");
  if (a.e_battle === "Yes") flags.push("Homework time often turns into a battle.");
  if ((a.g_slots || []).length) {
    const tz = a.g_tz === "Other" ? (a.g_tz_other || "other time zone") : (a.g_tz || "time zone not given");
    flags.push("Availability (" + tz + "): " + a.g_slots.join(", ") + ".");
  }

  const lead = parts[0] && parts[0].pct > 0 ? parts[0] : null;
  return { form: "parent", parts, lead, topThree, flags };
}

export function scoreStudent(a: Answers): StudentResult {
  const parts: PartScore[] = STUDENT_PARTS.map(([n, title, , items, avatar]) => {
    const total = items.reduce((sum, [id]) => sum + (a[id] || 0), 0);
    const answered = items.filter(([id]) => a[id]).length;
    return { n, title, avatar, label: avatar + " (" + title + ")", total, answered, max: 12, pct: total / 12 };
  }).sort((x, y) => y.total - x.total || x.n - y.n);

  const flags: string[] = [];
  if (["A lot", "Almost every day"].includes(a.d_often)) flags.push("Steady first: schoolwork stresses them out " + a.d_often.toLowerCase() + ".");
  if ((a.d_do || []).includes("Get upset or shut down")) flags.push("Says they get upset or shut down when work gets frustrating.");
  if (a.d_stick === "A few days or more") flags.push("Upsets stick for a few days or more.");
  if (["The night before", "The morning of", "I don't really study"].includes(a.c_start)) flags.push("Test prep starts: " + a.c_start.toLowerCase() + ".");
  if (a.c_after === "I thought it went better than it did") flags.push("Often thinks tests went better than they did.");
  if (["Right next to me", "In my hand"].includes(a.c_phone)) flags.push("Phone during homework: " + a.c_phone.toLowerCase() + ".");
  if (a.e_free === "Almost none") flags.push("Almost no free time on school nights.");

  const lead = parts[0] && parts[0].total > 0 ? parts[0] : null;
  return { form: "student", parts, lead, flags };
}
