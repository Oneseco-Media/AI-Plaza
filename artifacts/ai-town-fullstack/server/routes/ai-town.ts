import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const aiTownRouter = Router();

// POST /api/ai-town/dialogue
aiTownRouter.post("/ai-town/dialogue", async (req, res) => {
  const { character, otherCharacter, worldMood, faction, role, trait, location } = req.body as {
    character: string;
    otherCharacter?: string;
    worldMood: string;
    faction?: string;
    role: string;
    trait: string;
    location?: string;
  };

  if (!character || !role || !trait || !worldMood) {
    res.status(400).json({ error: "character, role, trait, and worldMood are required" });
    return;
  }

  try {
    const systemPrompt = `You are simulating dialogue for an RPG world engine. 
Generate short, in-character speech lines (max 15 words) for medieval fantasy RPG characters.
The world mood is currently: ${worldMood}.
Keep responses brief, atmospheric, and fitting for a dark medieval fantasy setting.
Do NOT use quotation marks around the response. Just the raw dialogue line.`;

    const userPrompt = otherCharacter
      ? `${character} is a ${role} with trait "${trait}"${faction ? `, member of ${faction}` : ""}${location ? `, currently at ${location}` : ""}. They are talking to ${otherCharacter}. Write one short line of dialogue they'd say.`
      : `${character} is a ${role} with trait "${trait}"${faction ? `, member of ${faction}` : ""}${location ? `, currently at ${location}` : ""}. Write one short line of dialogue they'd mutter to themselves or say aloud.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 50,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("Empty AI response");
    res.json({ text: raw });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI dialogue");
    const fallbacks: Record<string, string[]> = {
      Warrior: ["Steel and glory, that's all I need.", "The dungeon won't clear itself.", "For the guild!"],
      Mage: ["The arcane energies are restless today.", "Ancient scrolls hold power beyond measure.", "Magic flows through all things."],
      Rogue: ["Eyes open, blade ready.", "Gold speaks louder than honor.", "Shadows are my allies."],
      Cleric: ["May the light guide us.", "Healing is my calling.", "Faith sustains where strength falters."],
      Paladin: ["Justice shall prevail.", "I uphold the code of honor.", "Evil shall not pass while I stand."],
      Merchant: ["A fair deal benefits all.", "Gold is the universal language.", "Supply and demand, always."],
    };
    const lines = fallbacks[role] ?? ["..."];
    res.json({ text: lines[Math.floor(Math.random() * lines.length)] });
  }
});

// POST /api/ai-town/world-event
aiTownRouter.post("/ai-town/world-event", async (req, res) => {
  const { eventType, worldMood, districts, factions } = req.body as {
    eventType: string;
    worldMood: string;
    districts: Record<string, { control: string; tension: number }>;
    factions: Record<string, { power: number; leader: string }>;
  };

  if (!eventType || !worldMood) {
    res.status(400).json({ error: "eventType and worldMood are required" });
    return;
  }

  try {
    const districtSummary = Object.entries(districts || {})
      .map(([name, d]) => `${name} (tension: ${d.tension}%, controlled by ${d.control})`)
      .join(", ");
    const factionSummary = Object.entries(factions || {})
      .map(([name, f]) => `${name} (power: ${f.power}, leader: ${f.leader})`)
      .join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 80,
      messages: [
        {
          role: "system",
          content: `You generate short world event announcements (max 20 words) for a dark medieval fantasy RPG world. 
Be dramatic and atmospheric. Current world mood: ${worldMood}.
Districts: ${districtSummary || "Unknown"}.
Factions: ${factionSummary || "Unknown"}.`,
        },
        {
          role: "user",
          content: `Generate a brief, dramatic world event announcement for event type: "${eventType}". Max 20 words.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("Empty AI response");
    res.json({ description: raw });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI world event");
    res.json({ description: `A ${eventType} shakes the realm!` });
  }
});

// POST /api/ai-town/task-outcome
aiTownRouter.post("/ai-town/task-outcome", async (req, res) => {
  const { characterName, role, task, success, roll, location } = req.body as {
    characterName: string;
    role: string;
    task: string;
    success: boolean;
    roll: number;
    location?: string;
  };

  if (!characterName || !task) {
    res.status(400).json({ error: "characterName and task are required" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 40,
      messages: [
        {
          role: "system",
          content: "Generate a one-sentence dramatic outcome narrative (max 15 words) for an RPG task. Be vivid and medieval-fantasy-themed.",
        },
        {
          role: "user",
          content: `${characterName} the ${role} attempted "${task}"${location ? ` at ${location}` : ""}. They rolled a ${roll}/10 and ${success ? "succeeded" : "failed"}. Describe the outcome in one short vivid sentence.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("Empty AI response");
    res.json({ narrative: raw });
  } catch (err) {
    req.log.error({ err }, "Failed to generate task outcome narrative");
    res.json({ narrative: success ? "Task completed successfully." : "The attempt ended in failure." });
  }
});

export default aiTownRouter;
