export type Niche =
  | "business"
  | "marketing"
  | "fitness"
  | "education"
  | "finance"
  | "real-estate"
  | "technology"
  | "lifestyle"
  | "gaming"
  | "ecommerce"
  | "other";

export type VideoType =
  | "tutorial"
  | "storytelling"
  | "review"
  | "listicle"
  | "comparison"
  | "educational"
  | "motivational"
  | "faceless"
  | "product-promotion"
  | "tiktok-ad";

export type VideoLength = "15s" | "30s" | "45s" | "60s" | "90s";

export type Tone =
  | "casual"
  | "professional"
  | "funny"
  | "educational"
  | "motivational"
  | "luxury"
  | "emotional"
  | "storytelling";

export type HookStyle =
  | "curiosity"
  | "shock"
  | "question"
  | "story"
  | "statistic"
  | "problem-solution"
  | "bold-claim"
  | "trending";

export interface GeneratorInput {
  topic: string;
  niche: Niche;
  videoType?: VideoType;
  videoLength?: VideoLength;
  audience?: string;
  tone?: Tone;
  hookStyle?: HookStyle;
  keywords?: string;
  callToAction?: string;
}

export interface GeneratorOutput {
  hook: string;
  intro: string;
  mainScript: string;
  script: string;
  fullScript: string;
  cta: string;
  caption: string;
  hashtags: string[];
}

export function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: string | undefined
): string {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}

function splitScriptBody(body: string): { intro: string; mainScript: string } {
  const sentences = body.match(/[^.!?]+[.!?]+/g) ?? [];
  if (sentences.length <= 1) {
    const midpoint = Math.max(1, Math.ceil(body.length * 0.35));
    return {
      intro: body.slice(0, midpoint).trim() || body,
      mainScript: body.slice(midpoint).trim() || body,
    };
  }

  const introCount = Math.max(1, Math.ceil(sentences.length * 0.3));
  return {
    intro: sentences.slice(0, introCount).join(" ").trim(),
    mainScript:
      sentences.slice(introCount).join(" ").trim() || (sentences[0] ?? body),
  };
}

export function normalizeScriptOutput(output: GeneratorOutput): GeneratorOutput {
  if (output.intro && output.mainScript) return output;
  const script = output.script ?? "";
  const { intro, mainScript } = splitScriptBody(script);
  return { ...output, intro, mainScript };
}

export const nicheOptions: { value: Niche; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "fitness", label: "Fitness" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "real-estate", label: "Real Estate" },
  { value: "technology", label: "Technology" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "gaming", label: "Gaming" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "other", label: "Other" },
];

export const videoTypeOptions: { value: VideoType; label: string }[] = [
  { value: "tutorial", label: "Tutorial" },
  { value: "storytelling", label: "Storytelling" },
  { value: "review", label: "Review" },
  { value: "listicle", label: "Listicle" },
  { value: "comparison", label: "Comparison" },
  { value: "educational", label: "Educational" },
  { value: "motivational", label: "Motivational" },
  { value: "faceless", label: "Faceless Video" },
  { value: "product-promotion", label: "Product Promotion" },
  { value: "tiktok-ad", label: "TikTok Ad" },
];

export const lengthOptions: { value: VideoLength; label: string }[] = [
  { value: "15s", label: "15 Seconds" },
  { value: "30s", label: "30 Seconds" },
  { value: "45s", label: "45 Seconds" },
  { value: "60s", label: "60 Seconds" },
  { value: "90s", label: "90 Seconds" },
];

export const toneOptions: { value: Tone; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "funny", label: "Funny" },
  { value: "educational", label: "Educational" },
  { value: "motivational", label: "Motivational" },
  { value: "luxury", label: "Luxury" },
  { value: "emotional", label: "Emotional" },
  { value: "storytelling", label: "Storytelling" },
];

export const hookStyleOptions: { value: HookStyle; label: string }[] = [
  { value: "curiosity", label: "Curiosity" },
  { value: "shock", label: "Shock" },
  { value: "question", label: "Question" },
  { value: "story", label: "Story" },
  { value: "statistic", label: "Statistic" },
  { value: "problem-solution", label: "Problem/Solution" },
  { value: "bold-claim", label: "Bold Claim" },
  { value: "trending", label: "Trending Style" },
];

const lengthWordCount: Record<VideoLength, number> = {
  "15s": 40,
  "30s": 80,
  "45s": 120,
  "60s": 160,
  "90s": 240,
};

const nicheHashtags: Record<Niche, string[]> = {
  business: ["#business", "#entrepreneur", "#startup"],
  marketing: ["#marketing", "#digitalmarketing", "#socialmediamarketing"],
  fitness: ["#fitness", "#workout", "#fitnesstips"],
  education: ["#education", "#learnontiktok", "#studytips"],
  finance: ["#finance", "#moneytips", "#personalfinance"],
  "real-estate": ["#realestate", "#realtor", "#property"],
  technology: ["#tech", "#technology", "#techtok"],
  lifestyle: ["#lifestyle", "#dailyvlog", "#lifehacks"],
  gaming: ["#gaming", "#gamer", "#gamingtiktok"],
  ecommerce: ["#ecommerce", "#onlinebusiness", "#shopify"],
  other: ["#contentcreator", "#tiktoktips", "#creatortips"],
};

const hookStyleTemplates: Record<HookStyle, string[]> = {
  curiosity: [
    "What if everything you knew about {topic} was wrong?",
    "Nobody talks about this part of {topic} — but they should.",
    "Here's the {topic} secret that changed everything for me.",
  ],
  shock: [
    "Stop scrolling — this {topic} hack is insane.",
    "I can't believe this actually works for {topic}.",
    "This {topic} mistake is costing you more than you think.",
  ],
  question: [
    "Why does nobody explain {topic} like this?",
    "Are you still struggling with {topic}? Watch this.",
    "What would happen if you mastered {topic} in 30 days?",
  ],
  story: [
    "Six months ago, I knew nothing about {topic}. Then this happened.",
    "I tried {topic} so you don't have to — here's what I learned.",
    "This is the {topic} story I wish someone told me sooner.",
  ],
  statistic: [
    "90% of people get {topic} wrong on the first try.",
    "Studies show this one {topic} shift doubles your results.",
    "Only 1 in 10 people use {topic} the right way — are you?",
  ],
  "problem-solution": [
    "Struggling with {topic}? Here's the fix in under 60 seconds.",
    "The #1 {topic} problem — and the simple solution.",
    "Tired of {topic} not working? Do this instead.",
  ],
  "bold-claim": [
    "Unpopular opinion: {topic} is easier than everyone makes it.",
    "I'm going to prove {topic} doesn't have to be complicated.",
    "Hot take — most {topic} advice online is completely wrong.",
  ],
  trending: [
    "POV: you finally cracked {topic}.",
    "Tell me you know {topic} without telling me you know {topic}.",
    "This {topic} trend is everywhere — here's why it works.",
  ],
};

const videoTypePhrases: Record<VideoType, string[]> = {
  tutorial: [
    "Step one — start with the basics of {topic}.",
    "Step two — apply this technique consistently.",
    "Step three — track your results and adjust.",
  ],
  storytelling: [
    "It started when I realized {topic} wasn't what I thought.",
    "The turning point came when I tried a different approach.",
    "That's when everything about {topic} finally clicked.",
  ],
  review: [
    "After testing this for weeks, here's my honest take on {topic}.",
    "The pros? It actually delivers on {topic}.",
    "The cons? You need to stay consistent to see results.",
  ],
  listicle: [
    "Number one — simplify how you think about {topic}.",
    "Number two — avoid the mistakes most beginners make.",
    "Number three — double down on what actually works.",
  ],
  comparison: [
    "Most people approach {topic} this way — but here's a better way.",
    "On one side, you have the old method. On the other, this.",
    "The difference? One saves time, the other wastes it.",
  ],
  educational: [
    "Let's break down {topic} in plain language.",
    "The core concept you need to understand first.",
    "Once you get this, the rest of {topic} makes sense.",
  ],
  motivational: [
    "You don't need to be perfect — you just need to start {topic}.",
    "Every expert in {topic} was once a beginner, just like you.",
    "The best time to begin was yesterday. The second best is now.",
  ],
  faceless: [
    "On screen: bold text highlighting the key {topic} insight.",
    "Cut to a quick demo showing the process step by step.",
    "End card with the main takeaway about {topic}.",
  ],
  "product-promotion": [
    "This is the tool that transformed how I handle {topic}.",
    "Here's exactly how it works and why it stands out.",
    "If you're serious about {topic}, this is worth a look.",
  ],
  "tiktok-ad": [
    "Attention — if {topic} matters to you, listen up.",
    "Introducing the fastest way to solve your {topic} problem.",
    "Limited time — tap the link and see the difference yourself.",
  ],
};

const toneModifiers: Record<Tone, string> = {
  casual: "Real talk —",
  professional: "Here's the data —",
  funny: "Okay but hear me out —",
  educational: "Quick lesson —",
  motivational: "You've got this —",
  luxury: "For those who expect excellence —",
  emotional: "This hit me hard —",
  storytelling: "Picture this —",
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, topic: string): string {
  return template.replace(/\{topic\}/g, topic.toLowerCase());
}

function parseKeywords(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function generateHashtags(
  topic: string,
  niche: Niche,
  keywords: string[]
): string[] {
  const topicWords = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const keywordTags = keywords
    .slice(0, 3)
    .map((k) => `#${k.toLowerCase().replace(/\s+/g, "")}`);

  const topicTags = topicWords.slice(0, 2).map((w) => `#${w}`);
  const base = ["#fyp", "#foryou", "#viral", "#tiktok"];

  return [...new Set([...keywordTags, ...topicTags, ...nicheHashtags[niche], ...base])].slice(
    0,
    12
  );
}

function buildScriptBody(
  input: Required<
    Pick<GeneratorInput, "topic" | "niche" | "videoType" | "tone" | "audience">
  > & { targetWords: number; keywords: string[] }
): string {
  const { topic, videoType, tone, audience, targetWords, keywords } = input;
  const phrases = [...videoTypePhrases[videoType]];
  const modifier = toneModifiers[tone];
  const audiencePhrase = audience
    ? `If you're ${audience}, this is for you.`
    : "Save this before you forget.";

  let script = `${modifier} ${fillTemplate(pickRandom(phrases), topic)}`;
  let wordCount = script.split(/\s+/).length;
  let i = 1;

  while (wordCount < targetWords && i < phrases.length * 4) {
    const phrase = fillTemplate(phrases[i % phrases.length], topic);
    script += ` ${phrase}`;
    wordCount += phrase.split(/\s+/).length;
    i++;
  }

  if (keywords.length > 0) {
    script += ` Key terms: ${keywords.slice(0, 4).join(", ")}.`;
  }

  script += ` ${audiencePhrase}`;
  return script.trim();
}

function generateCTA(
  tone: Tone,
  audience: string,
  customCta?: string
): string {
  if (customCta?.trim()) return customCta.trim();

  const ctas: Record<Tone, string[]> = {
    casual: [
      `Follow for more — your ${audience || "For You Page"} will thank you.`,
      "Save this for later. You'll need it.",
      "Drop a comment if this helped!",
    ],
    professional: [
      `Follow for actionable insights${audience ? ` for ${audience}` : ""}.`,
      "Save this framework and share it with your network.",
      "Comment if you want the extended breakdown.",
    ],
    funny: [
      "Follow for more accidentally useful content.",
      "Tag someone who needs to hear this.",
      "Comment your worst take — I'll go first.",
    ],
    educational: [
      "Follow for more breakdowns like this.",
      "Save and revisit when you're ready to apply.",
      "What should I explain next? Comment below.",
    ],
    motivational: [
      "Follow if you're ready to level up.",
      audience ? `Share with another ${audience} who needs the push.` : "Share with someone who needs this.",
      'Comment "ready" if you\'re taking action today.',
    ],
    luxury: [
      "Follow for premium insights — no fluff, ever.",
      "Save this for when you're ready to invest in excellence.",
      "Join the community that expects more.",
    ],
    emotional: [
      "If this resonated, follow for more real talk.",
      "Share this with someone who needs to hear it today.",
      "You're not alone — comment and connect.",
    ],
    storytelling: [
      "Follow for more stories that actually teach something.",
      "Part two is coming — follow so you don't miss it.",
      "What would you do? Tell me in the comments.",
    ],
  };

  return pickRandom(ctas[tone]);
}

function generateCaption(
  topic: string,
  tone: Tone,
  niche: Niche,
  audience: string,
  keywords: string[]
): string {
  const emoji =
    tone === "funny" ? "😂 " : tone === "motivational" ? "🔥 " : tone === "luxury" ? "✨ " : "";
  const keywordLine =
    keywords.length > 0 ? `\n\n${keywords.slice(0, 5).join(" · ")}` : "";
  const audienceLine = audience ? ` Made for ${audience}.` : "";

  return `${emoji}${topic} — ${niche.replace("-", " ")} content${audienceLine} Save this, share it, and let me know what you think.${keywordLine}`;
}

export function generateScript(input: GeneratorInput): GeneratorOutput {
  const topic = input.topic.trim();
  const niche = input.niche ?? "other";
  const videoType = input.videoType ?? "educational";
  const videoLength = input.videoLength ?? "30s";
  const tone = input.tone ?? "casual";
  const hookStyle = input.hookStyle ?? "curiosity";
  const audience = input.audience?.trim() ?? "";
  const keywords = parseKeywords(input.keywords);
  const targetWords = lengthWordCount[videoLength];

  const hookTemplate = pickRandom(hookStyleTemplates[hookStyle]);
  const hook = fillTemplate(hookTemplate, topic);

  const script = buildScriptBody({
    topic,
    niche,
    videoType,
    tone,
    audience,
    targetWords,
    keywords,
  });

  const cta = generateCTA(tone, audience, input.callToAction);
  const { intro, mainScript } = splitScriptBody(script);
  const fullScript = [hook, intro, mainScript, cta].join("\n\n");
  const caption = generateCaption(topic, tone, niche, audience, keywords);
  const hashtags = generateHashtags(topic, niche, keywords);

  return normalizeScriptOutput({
    hook,
    intro,
    mainScript,
    script,
    fullScript,
    cta,
    caption,
    hashtags,
  });
}
