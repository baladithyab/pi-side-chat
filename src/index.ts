import { complete } from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { DynamicBorder, getMarkdownTheme } from "@earendil-works/pi-coding-agent";
import { Container, Markdown, matchesKey, Text } from "@earendil-works/pi-tui";
import { buildConversationSnapshot, SIDE_SYSTEM_PROMPT } from "./context.js";

async function show(answer: string, ctx: ExtensionCommandContext): Promise<void> {
  if (ctx.mode !== "tui") { ctx.ui.notify(answer, "info"); return; }
  await ctx.ui.custom((_tui, theme, _kb, done) => {
    const box = new Container();
    box.addChild(new DynamicBorder(s => theme.fg("accent", s)));
    box.addChild(new Text(theme.fg("accent", theme.bold("BTW — ephemeral side answer")), 1, 0));
    box.addChild(new Markdown(answer, 1, 1, getMarkdownTheme()));
    box.addChild(new Text(theme.fg("dim", "Enter / Space / Esc dismisses · not added to the transcript"), 1, 0));
    box.addChild(new DynamicBorder(s => theme.fg("accent", s)));
    return {
      render: (width: number) => box.render(width),
      invalidate: () => box.invalidate(),
      handleInput: (data: string) => {
        if (matchesKey(data, "enter") || matchesKey(data, "space") || matchesKey(data, "escape")) done(undefined);
      },
    };
  });
}

export default function sideChat(pi: ExtensionAPI): void {
  let running = false;
  pi.registerCommand("btw", {
    description: "Ask one ephemeral, tool-free side question without changing the main transcript",
    handler: async (args, ctx) => {
      const question = args.trim();
      if (!question) { ctx.ui.notify("Usage: /btw <side question>", "warning"); return; }
      if (running) { ctx.ui.notify("A /btw side question is already running.", "warning"); return; }
      const model = ctx.model;
      if (!model) { ctx.ui.notify("No active model is available for /btw.", "error"); return; }
      const snapshot = buildConversationSnapshot(ctx.sessionManager.getBranch());
      if (!snapshot) { ctx.ui.notify("No stable conversation context is available yet.", "warning"); return; }
      running = true;
      const abort = new AbortController();
      try {
        const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
        if (!auth.ok) throw new Error(auth.error);
        const response = await complete(model, {
          systemPrompt: SIDE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: [{ type: "text", text: `<conversation_snapshot>\n${snapshot}\n</conversation_snapshot>\n\n<side_question>\n${question}\n</side_question>` }], timestamp: Date.now() }],
          tools: [],
        }, {
          apiKey: auth.apiKey,
          headers: auth.headers,
          env: auth.env,
          signal: abort.signal,
          maxTokens: Math.min(1200, model.maxTokens),
          reasoning: "off",
          cacheRetention: "none",
        });
        const answer = response.content.filter((x): x is { type: "text"; text: string } => x.type === "text").map(x => x.text).join("\n").trim();
        await show(answer || "The side model returned no text.", ctx);
      } catch (error) {
        ctx.ui.notify(`/btw failed: ${error instanceof Error ? error.message : String(error)}`, "error");
      } finally { running = false; }
    },
  });
}

export * from "./context.js";
