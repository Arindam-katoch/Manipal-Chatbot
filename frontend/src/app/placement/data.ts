/* ─── Types ───────────────────────────────────────────────────────────── */

export type CompanyName =
  | "Google"
  | "Microsoft"
  | "Goldman Sachs"
  | "Amazon"
  | "Deloitte"
  | "JP Morgan"
  | "Infosys"
  | "McKinsey";

export type Sector = "Tech" | "Finance" | "Consulting";

export type CalendarColor =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "red"
  | "gray";

export type QuestionTag =
  | "System Design"
  | "Distributed"
  | "Algorithms"
  | "Heaps"
  | "Trees"
  | "BFS"
  | "Behavioral"
  | "Leadership"
  | "Finance"
  | "Valuation"
  | "Case Study"
  | "Strategy"
  | "CAP Theorem"
  | "M&A"
  | "Profitability";

/* ─── Data ───────────────────────────────────────────────────────────── */

export const stats = [
  { label: "Students placed", value: "847", sub: "Class of 2024" },
  { label: "Average package", value: "₹12.4L", sub: "Per annum" },
  { label: "Highest package", value: "₹48L", sub: "Google — 2024" },
  { label: "Companies visited", value: "134", sub: "This year" },
];

/** Quick lookup for company logo initials (e.g. "GS" for Goldman Sachs). */
export const companyLogos: Record<CompanyName, string> = {
  Google: "G",
  Microsoft: "Ms",
  "Goldman Sachs": "GS",
  Amazon: "Az",
  Deloitte: "D",
  "JP Morgan": "JP",
  Infosys: "In",
  McKinsey: "Mc",
};

export const companies: {
  name: CompanyName;
  sector: Sector;
  placed: number;
  avg: string;
  high: string;
  logo: string;
}[] = [
  { name: "Google", sector: "Tech", placed: 12, avg: "₹42L", high: "₹48L", logo: "G" },
  { name: "Microsoft", sector: "Tech", placed: 18, avg: "₹32L", high: "₹38L", logo: "Ms" },
  { name: "Goldman Sachs", sector: "Finance", placed: 9, avg: "₹28L", high: "₹34L", logo: "GS" },
  { name: "Amazon", sector: "Tech", placed: 24, avg: "₹24L", high: "₹30L", logo: "Az" },
  { name: "Deloitte", sector: "Consulting", placed: 31, avg: "₹10L", high: "₹14L", logo: "D" },
  { name: "JP Morgan", sector: "Finance", placed: 11, avg: "₹22L", high: "₹26L", logo: "JP" },
  { name: "Infosys", sector: "Tech", placed: 45, avg: "₹7L", high: "₹9L", logo: "In" },
  { name: "McKinsey", sector: "Consulting", placed: 5, avg: "₹35L", high: "₹40L", logo: "Mc" },
];

export const questions: {
  company: CompanyName;
  role: string;
  round: string;
  q: string;
  tags: QuestionTag[];
}[] = [
  { company: "Google", role: "SWE", round: "Technical", q: "Design a distributed key-value store that supports 1M reads/sec.", tags: ["System Design", "Distributed"] },
  { company: "Google", role: "SWE", round: "Technical", q: "Given a stream of integers, find the median at every step in O(log n).", tags: ["Algorithms", "Heaps"] },
  { company: "Microsoft", role: "SDE-2", round: "Technical", q: "Serialize and deserialize a binary tree.", tags: ["Trees", "BFS"] },
  { company: "Microsoft", role: "SDE-2", round: "HR", q: "Tell me about a time you disagreed with your manager and how you handled it.", tags: ["Behavioral", "Leadership"] },
  { company: "Goldman Sachs", role: "Analyst", round: "Technical", q: "Walk me through a DCF model for a SaaS company. What discount rate would you use?", tags: ["Finance", "Valuation"] },
  { company: "Goldman Sachs", role: "Analyst", round: "Case", q: "A retail client wants to expand to Southeast Asia. How would you advise them?", tags: ["Case Study", "Strategy"] },
  { company: "Amazon", role: "SDE", round: "Technical", q: "Design Amazon's shopping cart system — focus on consistency vs availability tradeoffs.", tags: ["System Design", "CAP Theorem"] },
  { company: "Amazon", role: "SDE", round: "Behavioral", q: "Describe a project where you had to deliver under extreme time pressure.", tags: ["Behavioral", "Leadership"] },
  { company: "Deloitte", role: "Analyst", round: "Case", q: "Your client's operating margins dropped 8% YoY. Walk through your diagnostic framework.", tags: ["Case Study", "Profitability"] },
  { company: "McKinsey", role: "BA", round: "Case", q: "A hospital chain is considering acquiring a diagnostics startup.", tags: ["Case Study", "M&A"] },
];

export const calendar: {
  date: string;
  day: string;
  company: CompanyName;
  role: string;
  type: string;
  color: CalendarColor;
}[] = [
  { date: "2 Jun", day: "Mon", company: "Google", role: "SWE Intern & FTE", type: "PPT + Test", color: "blue" },
  { date: "5 Jun", day: "Thu", company: "Goldman Sachs", role: "Analyst", type: "Shortlist Release", color: "green" },
  { date: "9 Jun", day: "Mon", company: "Microsoft", role: "SDE", type: "Technical Interviews", color: "blue" },
  { date: "11 Jun", day: "Wed", company: "Amazon", role: "SDE / BIE", type: "Online Assessment", color: "orange" },
  { date: "14 Jun", day: "Sat", company: "Deloitte", role: "Analyst", type: "PPT + GD", color: "purple" },
  { date: "17 Jun", day: "Tue", company: "JP Morgan", role: "Analyst", type: "HireVue Round", color: "green" },
  { date: "20 Jun", day: "Fri", company: "McKinsey", role: "Business Analyst", type: "Case Interviews", color: "red" },
  { date: "23 Jun", day: "Mon", company: "Infosys", role: "Systems Engineer", type: "Mass Drive", color: "gray" },
];

export const sectors: ("All" | Sector)[] = ["All", "Tech", "Finance", "Consulting"];

export const tagColors: Record<QuestionTag, string> = {
  "System Design": "bg-blue-50 text-blue-600",
  Distributed: "bg-indigo-50 text-indigo-600",
  Algorithms: "bg-purple-50 text-purple-600",
  Heaps: "bg-purple-50 text-purple-600",
  Trees: "bg-green-50 text-green-600",
  BFS: "bg-green-50 text-green-600",
  Behavioral: "bg-yellow-50 text-yellow-700",
  Leadership: "bg-yellow-50 text-yellow-700",
  Finance: "bg-emerald-50 text-emerald-600",
  Valuation: "bg-emerald-50 text-emerald-600",
  "Case Study": "bg-orange-50 text-orange-600",
  Strategy: "bg-orange-50 text-orange-600",
  "CAP Theorem": "bg-blue-50 text-blue-600",
  "M&A": "bg-rose-50 text-rose-600",
  Profitability: "bg-orange-50 text-orange-600",
};

export const calColors: Record<CalendarColor, string> = {
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  orange: "bg-brand-50 text-brand-700 ring-brand-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  gray: "bg-slate-50 text-slate-600 ring-slate-200",
};

export const logoColors: Record<CompanyName, string> = {
  Google: "bg-blue-100 text-blue-700",
  Microsoft: "bg-indigo-100 text-indigo-700",
  "Goldman Sachs": "bg-emerald-100 text-emerald-700",
  Amazon: "bg-orange-100 text-orange-700",
  Deloitte: "bg-green-100 text-green-700",
  "JP Morgan": "bg-sky-100 text-sky-700",
  Infosys: "bg-purple-100 text-purple-700",
  McKinsey: "bg-rose-100 text-rose-700",
};
