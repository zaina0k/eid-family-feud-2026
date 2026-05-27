// One-shot build script.
//
// Reads ../family-feud-selected.md (relative to project root) and writes
// src/data/questions.json. The markdown uses `1.` for every question
// (repeated ordinal); we ignore that and assign our own sequential id.
//
// Bold lines `**...**` are prompts. Lines `- Answer (points)` are answers.
// Answer counts vary 4-8 and are preserved in source order (high -> low).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
// Selected questions file lives one level above the Vite project, in the
// repo root next to family-feud-blueprint.md.
const INPUT = resolve(projectRoot, '..', 'family-feud-selected.md');
const OUTPUT = resolve(projectRoot, 'src', 'data', 'questions.json');

const md = readFileSync(INPUT, 'utf8');
const lines = md.split(/\r?\n/);

const questions = [];
let current = null;
let nextId = 1;

const promptRe = /^\s*\d+\.\s+\*\*(.+?)\*\*\s*$/;
const answerRe = /^\s*-\s+(.+?)\s+\((\d+)\)\s*$/;

for (const raw of lines) {
  const promptMatch = raw.match(promptRe);
  if (promptMatch) {
    if (current) questions.push(current);
    current = { id: nextId++, prompt: promptMatch[1].trim(), answers: [] };
    continue;
  }
  const ansMatch = raw.match(answerRe);
  if (ansMatch && current) {
    current.answers.push({ text: ansMatch[1].trim(), points: Number(ansMatch[2]) });
  }
}
if (current) questions.push(current);

// Sanity checks — keep these noisy so a malformed input is obvious.
if (questions.length === 0) {
  console.error('Parse produced 0 questions. Check INPUT path:', INPUT);
  process.exit(1);
}
const badCount = questions.filter((q) => q.answers.length < 4 || q.answers.length > 8);
if (badCount.length) {
  console.warn(
    `Warning: ${badCount.length} question(s) have answer counts outside 4-8:`,
    badCount.map((q) => `#${q.id} (${q.answers.length})`).join(', ')
  );
}

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(questions, null, 2) + '\n', 'utf8');

const totalAnswers = questions.reduce((n, q) => n + q.answers.length, 0);
console.log(
  `Wrote ${questions.length} questions (${totalAnswers} answers) -> ${OUTPUT}`
);
