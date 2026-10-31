"use client";

import { useState } from "react";
import { GeneratePanel } from "@/components/questions/generate-panel";
import type { Difficulty } from "@/lib/schemas";

const SKILLS = [
  "Python",
  "JavaScript",
  "React",
  "Django",
  "Docker",
  "AWS",
  "Git",
  "PostgreSQL",
  "Redis",
  "Kubernetes",
  "TypeScript",
  "Node.js",
];

export default function SkillLabPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [selected, setSelected] = useState<string[]>(SKILLS.slice(0, 10));

  return (
    <main className="mx-auto w-full max-w-300 px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Skill selector check</h1>
      <GeneratePanel
        value={difficulty}
        onChange={setDifficulty}
        completed={[]}
        offline={false}
        onGenerate={() => {}}
        skills={SKILLS}
        selectedSkills={selected}
        onSelectionChange={setSelected}
      />
    </main>
  );
}
