type Block = { type?: string; text?: string; thinking?: string; name?: string; arguments?: unknown };
type Entry = { type?: string; message?: { role?: string; content?: unknown; toolName?: string } };

function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.flatMap((part: unknown) => {
    if (!part || typeof part !== "object") return [];
    const b = part as Block;
    if (b.type === "text" && b.text) return [b.text];
    if (b.type === "toolCall" && b.name) return [`[Called ${b.name} with ${JSON.stringify(b.arguments ?? {})}]`];
    return [];
  }).join("\n");
}

export function buildConversationSnapshot(entries: Entry[], maxChars = 180_000): string {
  const sections: string[] = [];
  for (const entry of entries) {
    if (entry.type !== "message" || !entry.message?.role) continue;
    const role = entry.message.role;
    if (!['user','assistant','toolResult'].includes(role)) continue;
    const text = contentText(entry.message.content).trim();
    if (text) sections.push(`${role === 'toolResult' ? `Tool result${entry.message.toolName ? ` (${entry.message.toolName})` : ''}` : role === 'user' ? 'User' : 'Assistant'}: ${text}`);
  }
  const joined = sections.join("\n\n");
  if (joined.length <= maxChars) return joined;
  return `[Earlier snapshot text omitted]\n\n${joined.slice(joined.length - maxChars)}`;
}

export const SIDE_SYSTEM_PROMPT = `You answer one ephemeral side question using the supplied conversation snapshot. The main coding agent continues independently. Answer directly in one response. You have no tools and must not claim to read files, run commands, edit code, contact services, or take future action. Distinguish facts present in the snapshot from general knowledge. Keep the answer concise. Never instruct or steer the main agent.`;
