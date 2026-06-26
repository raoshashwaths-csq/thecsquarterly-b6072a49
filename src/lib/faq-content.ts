// Localized FAQ content. English is the source of truth; other locales
// supply partial overrides and inherit missing strings from English.

import { GLOSSARY } from "@/lib/glossary";

export type QA = { slug: string; q: string; a: string };
export type FaqSection = {
  slug: string;
  eyebrow: string;
  title: string;
  items: QA[];
};
export type FaqUi = {
  eyebrow: string;
  title: string;
  sub: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchClear: string;
  feedbackPrompt: string;
  feedbackHelpful: string;
  feedbackNotHelpful: string;
  feedbackThanks: string;
  contact: string;
  contactLink: string;
};

const EN_UI: FaqUi = {
  eyebrow: "Frequently Asked",
  title: "Everything, in one place.",
  sub: "What the product does, how Lumi works, how billing and sharing behave, and a glossary of the terms we lean on every week.",
  searchPlaceholder: "Search questions, terms, or features…",
  searchNoResults: "No matches. Try a different keyword.",
  searchClear: "Clear",
  feedbackPrompt: "Was this helpful?",
  feedbackHelpful: "Yes",
  feedbackNotHelpful: "No",
  feedbackThanks: "Thanks for the signal.",
  contact: "Didn't find your question?",
  contactLink: "Get in touch",
};

const glossarySection = (titleFn: (term: string) => string): FaqSection => ({
  slug: "glossary",
  eyebrow: "Reference",
  title: "Glossary",
  items: Object.values(GLOSSARY).map((g) => ({
    slug: g.term.toLowerCase(),
    q: titleFn(g.term),
    a: g.definition,
  })),
});

const EN_SECTIONS: FaqSection[] = [
  {
    slug: "basics",
    eyebrow: "Start here",
    title: "The Basics",
    items: [
      { slug: "what-is-tcsq", q: "What is The CS Quarterly?", a: "The CS Quarterly is a weekly dispatch and operating platform for Customer Success leaders. We publish one essay every Tuesday, maintain a Codex of playbooks, and ship operator-grade tools (diagnostics, dashboards, decision canvases) for VPs, Directors, and Senior CSMs at SaaS companies between $20M and $1B ARR." },
      { slug: "cadence", q: "How often do you publish?", a: "One dispatch every Tuesday. No daily noise, no clickbait, no SEO filler. Each dispatch follows our 3-2-1 model: three facts, two insights, one actionable." },
      { slug: "audience", q: "Who is this for?", a: "Operators who own retention and expansion outcomes — typically VPs of CS, Directors, Senior CSMs, and Heads of Post-Sales at B2B SaaS companies. If you're benchmarking against 120% NRR, you're our reader." },
      { slug: "is-it-free", q: "Is it free?", a: "The weekly briefing, public archive, Retention Ledger ticker, and the free top-line AI Readiness score are all free. Deeper tools (full Codex, Custom Blueprints, CSFactors, Lumi canvas runs) sit behind paid tiers." },
      { slug: "subscribe", q: "How do I subscribe?", a: "Use Subscribe in the footer to join the free briefing, or visit Pricing to compare paid tiers (Vanguard, Practitioner, Operator, Team, Scale, Enterprise)." },
    ],
  },
  {
    slug: "lumi",
    eyebrow: "The product",
    title: "Lumi — your CS agent",
    items: [
      { slug: "what-is-lumi", q: "Who or what is Lumi?", a: "Lumi is the single AI agent that powers the entire product — both on the marketing site (essays, Codex) and inside CSFactors (canvas, dashboards). Lumi answers framework questions, runs structured decision canvases, summarizes your workspace, and surfaces signals across your portfolio." },
      { slug: "canvas", q: "How does the Decision Canvas work?", a: "Ask Lumi a renewal, expansion, or escalation question. Lumi runs it through a structured framework tree, returns a sourced response with zones (Themes, Action Items, Watchlist), and saves the run to your workspace. Each completed run counts toward your monthly Lumi usage." },
      { slug: "what-is-run", q: "What counts as a Lumi run?", a: "Any completed canvas execution or workspace summary export counts as one run. Browsing a saved run, re-reading it, or sharing it does not consume usage." },
      { slug: "run-quotas", q: "How many Lumi runs do I get?", a: "Practitioner includes 50 runs/month, Operator 100, Team 500, Scale 2000, Enterprise 5000. Runs reset on your billing date and do not roll over." },
      { slug: "share-run", q: "Can I share a Lumi run with someone outside the site?", a: "Yes. Every run has a public share link. Anonymous viewers can read up to the 50% scroll point. To unlock the rest, they share their email and instantly get free Reader access — they can keep reading the run and explore the public side of the site." },
      { slug: "voice", q: "Can I speak to Lumi instead of typing?", a: "Yes. Lumi supports voice input on both the global agent button and the CSFactors drawer, powered by ElevenLabs speech-to-text. Tap the mic, dictate, tap to stop." },
      { slug: "lumi-debrief", q: "What is the Lumi Debrief?", a: "When you scroll to ~90% of a dispatch, Lumi slides in with a debrief card. The opening question is generated from the dispatch's '1 actionable' (the third pillar of our 3-2-1 model), and your conversation is saved to your Situation Room automatically. Free readers get one debrief per month; paid tiers count it as one Lumi run from your monthly pool." },
      { slug: "dispatch-reactions", q: "What are dispatch reactions?", a: "At the end of every dispatch, you tap one of four reactions: 'Changed how I'll approach an account this week', 'Gave me language I didn't have', 'Confirmed something I already believed', or 'I disagree with the thesis.' One signal per reader per article. Results are shown to all readers (e.g. '61% of operators said this changed their approach this week') and feed the editorial dashboard." },
      { slug: "pushback-thread", q: "What happens when I tap 'I disagree with the thesis'?", a: "Lumi opens an inline pushback thread asking where the thesis breaks for you. The conversation is saved to your Situation Room and the editorial team uses these threads — anonymously — to calibrate future dispatches. The disagree reaction itself is free; follow-up turns in the thread count as Lumi runs like any other conversation." },
    ],
  },
  {
    slug: "workspace",
    eyebrow: "The product",
    title: "Workspace & Exports",
    items: [
      { slug: "what-is-workspace", q: "What is my Workspace?", a: "Your Workspace is the private home for everything you've saved: pinned essays, highlights, Lumi runs, annotations, and ad-hoc notes. It's the read-and-act layer that sits between the dispatch and your day job." },
      { slug: "pdf-exports", q: "How do PDF exports work?", a: "Open Export PDF from the account menu or the Workspace header. Pick the articles and Lumi runs you want to include, optionally add a Lumi-Summarized workspace digest, and download. Every PDF is rendered in our dark-mode brand template (midnight-blue ground, gold accents, cream text) and personalized with your first name." },
      { slug: "lumi-summary", q: "What is a Lumi-Summarized export?", a: "A Lumi-generated digest of your recent workspace activity, organized into Themes, Action Items, and Watchlist. It counts as one Lumi run against your monthly usage." },
      { slug: "highlights", q: "Where are my highlights stored?", a: "In your Workspace, scoped to your account. Highlights persist across devices once you're signed in." },
    ],
  },
  {
    slug: "csfactors",
    eyebrow: "The product",
    title: "CSFactors — the command centre",
    items: [
      { slug: "what-is-csf", q: "What is CSFactors?", a: "CSFactors is the operator dashboard inside the platform: portfolio analytics, account health, renewals pipeline, expansion opportunities, stakeholder maps, and CTAs (Calls to Action). It's the daily console for a CS leader running a book of business." },
      { slug: "csf-tier", q: "Which tier unlocks CSFactors?", a: "Practitioner and above. Operator adds the executive analytics layer (NRR waterfall, retention funnel, stakeholder radar, team leaderboard)." },
      { slug: "cta", q: "What's a CTA in CSFactors?", a: "A Call to Action — a triggered task on a specific account (e.g. \"low usage 14 days\", \"renewal in 60d, no champion mapped\"). CTAs are how the system tells you what to act on today." },
      { slug: "stakeholder-map", q: "What's a Stakeholder Map?", a: "A visual mapping of every contact at an account, scored by influence, sentiment, and engagement. Use it to spot champion dependency risk before it bites you at renewal." },
    ],
  },
  {
    slug: "diagnostics",
    eyebrow: "The product",
    title: "Diagnostics, Benchmarks & Calculators",
    items: [
      { slug: "ai-readiness", q: "How does the AI Readiness Diagnostic work?", a: "Five minutes, 32 metrics across 8 dimensions. You get a free top-line band (Reactive / Operational / Predictive) instantly. Paid tiers unlock the 12-page Custom Blueprint with prioritized fixes." },
      { slug: "champion-dependency", q: "What's the Champion Dependency diagnostic?", a: "A focused diagnostic that flags accounts where retention is dangerously tied to a single contact. Outputs risk score and a mitigation playbook." },
      { slug: "calculator", q: "What's the ROI Calculator?", a: "A model that translates CS investment (headcount, tooling, programs) into projected NRR uplift, payback period, and gross margin impact. Useful for budget conversations with your CFO." },
      { slug: "benchmarks", q: "What are the NRR Benchmarks?", a: "Anonymized quarterly data from operators in our community, segmented by ARR band, segment (SMB / Mid-Market / Enterprise), and motion (PLG / Sales-led / Hybrid)." },
    ],
  },
  {
    slug: "editorial",
    eyebrow: "The product",
    title: "Editorial",
    items: [
      { slug: "sections", q: "What are the four editorial sections?", a: "The CS Vanguard (news & field reports), The Retention Protocol (playbooks & frameworks), The Outcome Forum (validated case studies), and The CS Codex (reference library)." },
      { slug: "two-voice", q: "What's the Two-Voice System?", a: "Every premium essay is written in two parallel registers: Analytical (structured, McKinsey-tone) and Witty (narrative, Wodehouse-tone). Toggle inline. Same argument, same facts, two reading experiences." },
      { slug: "3-2-1", q: "What's the 3-2-1 model?", a: "Our editorial spine: every new article delivers three facts, two insights, and one actionable. No filler, no recap, no \"5 things\" listicles." },
      { slug: "guest", q: "Can I submit a guest piece?", a: "We don't accept unsolicited submissions but we do commission operator essays for The Outcome Forum. Pitch via the contact link in the footer." },
    ],
  },
  {
    slug: "billing",
    eyebrow: "Account",
    title: "Account, Billing & Tiers",
    items: [
      { slug: "tiers", q: "What tiers are available?", a: "Free Briefing, Vanguard, Practitioner ($39/mo), Operator ($89/mo), Team, Scale, and Enterprise. Pricing and entitlements live on /pricing." },
      { slug: "sign-in", q: "How do I sign in?", a: "Email/password or Google. Use the sign-in link in the header." },
      { slug: "cancel", q: "How do I cancel or change plan?", a: "Account → Billing. Changes take effect at the end of your current billing cycle. No retention dark patterns." },
      { slug: "team-pricing", q: "Do you offer team or enterprise pricing?", a: "Yes — Team, Scale, and Enterprise tiers include seat pools, shared workspaces, and admin controls. Contact us via the footer for Enterprise quotes." },
      { slug: "refunds", q: "Do you offer refunds?", a: "Within 14 days of your first paid charge, full refund, no questions. After that, billing is non-refundable but you can cancel anytime to stop future charges." },
    ],
  },
  {
    slug: "privacy",
    eyebrow: "Account",
    title: "Privacy, Data & Security",
    items: [
      { slug: "data-storage", q: "Where is my data stored?", a: "On managed infrastructure with row-level security. Your Workspace data, Lumi runs, and highlights are private to your account." },
      { slug: "training", q: "Do you train AI models on my data?", a: "No. Your Workspace content, Lumi prompts, and account data are never used to train third-party models." },
      { slug: "delete", q: "What happens when I delete my account?", a: "Your Workspace, highlights, runs, and personal data are permanently deleted within 30 days. Anonymous aggregate benchmarks remain." },
      { slug: "unsubscribe", q: "How do I unsubscribe from emails?", a: "Every email has a one-click unsubscribe footer link, or use /unsubscribe directly." },
    ],
  },
  {
    slug: "sharing",
    eyebrow: "Account",
    title: "Sharing & Reader Access",
    items: [
      { slug: "reader", q: "What is Reader access?", a: "Reader is the free tier that anonymous visitors unlock by sharing their email when they hit the paywall on a shared Lumi run. Reader includes the weekly briefing, the public archive, and continued access to any shared run." },
      { slug: "why-email", q: "Why am I being asked for an email on a shared run?", a: "Shared runs are gated past the 50% scroll mark. Sharing your email unlocks the full run instantly and grants Reader access — no credit card, no spam." },
      { slug: "redirect", q: "Does the gated viewer get redirected to the original run?", a: "Yes. After unlocking, the viewer stays on the original run page and a welcome popup confirms what they've unlocked before fading away." },
    ],
  },
  glossarySection((term) => `What does ${term} mean?`),
  {
    slug: "help",
    eyebrow: "Help",
    title: "Troubleshooting & Contact",
    items: [
      { slug: "blank-page", q: "I'm signed in but a page is blank — what's wrong?", a: "Most blank pages on authenticated routes mean your session expired. Sign out and back in. If it persists, clear site data for thecsquarterly.com and try again." },
      { slug: "failed-run", q: "A Lumi run failed mid-way — am I charged?", a: "No. Failed runs do not count against your monthly Lumi usage. You can retry from the run page." },
      { slug: "no-pricing-header", q: "I can't see the Pricing or Subscribe link in the header.", a: "By design. Pricing and Subscribe live in the footer and inline CTAs only — the header is reserved for sections and your account." },
      { slug: "support", q: "How do I contact support?", a: "Use the Contact link in the footer. We reply within one business day, usually faster." },
    ],
  },
];

// Locale overrides — partial. Anything missing falls back to English.
type LocaleOverride = {
  ui?: Partial<FaqUi>;
  sectionLabels?: Record<string, { eyebrow?: string; title?: string }>;
};

const OVERRIDES: Record<string, LocaleOverride> = {
  ar: {
    ui: {
      eyebrow: "الأسئلة الشائعة",
      title: "كل شيء في مكان واحد.",
      sub: "ما يفعله المنتج، وكيف يعمل Lumi، وكيف تعمل الفوترة والمشاركة، ومسرد للمصطلحات التي نستخدمها أسبوعياً.",
      searchPlaceholder: "ابحث عن سؤال أو مصطلح أو ميزة…",
      searchNoResults: "لا توجد نتائج. جرّب كلمة مفتاحية أخرى.",
      searchClear: "مسح",
      feedbackPrompt: "هل كان هذا مفيداً؟",
      feedbackHelpful: "نعم",
      feedbackNotHelpful: "لا",
      feedbackThanks: "شكراً لملاحظتك.",
      contact: "لم تجد سؤالك؟",
      contactLink: "تواصل معنا",
    },
    sectionLabels: {
      basics: { eyebrow: "ابدأ هنا", title: "الأساسيات" },
      lumi: { eyebrow: "المنتج", title: "Lumi — وكيل النجاح" },
      workspace: { eyebrow: "المنتج", title: "مساحة العمل والتصدير" },
      csfactors: { eyebrow: "المنتج", title: "CSFactors — مركز القيادة" },
      diagnostics: { eyebrow: "المنتج", title: "التشخيصات والمقاييس" },
      editorial: { eyebrow: "المنتج", title: "التحرير" },
      billing: { eyebrow: "الحساب", title: "الحساب والفوترة والباقات" },
      privacy: { eyebrow: "الحساب", title: "الخصوصية والبيانات والأمن" },
      sharing: { eyebrow: "الحساب", title: "المشاركة ووصول القارئ" },
      glossary: { eyebrow: "مرجع", title: "المسرد" },
      help: { eyebrow: "مساعدة", title: "استكشاف الأخطاء والتواصل" },
    },
  },
  id: {
    ui: {
      eyebrow: "Pertanyaan Umum",
      title: "Semuanya, di satu tempat.",
      sub: "Apa yang dilakukan produk, cara kerja Lumi, cara penagihan dan berbagi, serta glosarium istilah yang kami gunakan setiap minggu.",
      searchPlaceholder: "Cari pertanyaan, istilah, atau fitur…",
      searchNoResults: "Tidak ada hasil. Coba kata kunci lain.",
      searchClear: "Bersihkan",
      feedbackPrompt: "Apakah ini membantu?",
      feedbackHelpful: "Ya",
      feedbackNotHelpful: "Tidak",
      feedbackThanks: "Terima kasih atas masukannya.",
      contact: "Tidak menemukan pertanyaan Anda?",
      contactLink: "Hubungi kami",
    },
    sectionLabels: {
      basics: { eyebrow: "Mulai di sini", title: "Dasar-dasar" },
      lumi: { eyebrow: "Produk", title: "Lumi — agen CS Anda" },
      workspace: { eyebrow: "Produk", title: "Ruang Kerja & Ekspor" },
      csfactors: { eyebrow: "Produk", title: "CSFactors — pusat komando" },
      diagnostics: { eyebrow: "Produk", title: "Diagnostik & Tolok Ukur" },
      editorial: { eyebrow: "Produk", title: "Editorial" },
      billing: { eyebrow: "Akun", title: "Akun, Penagihan & Paket" },
      privacy: { eyebrow: "Akun", title: "Privasi, Data & Keamanan" },
      sharing: { eyebrow: "Akun", title: "Berbagi & Akses Pembaca" },
      glossary: { eyebrow: "Referensi", title: "Glosarium" },
      help: { eyebrow: "Bantuan", title: "Pemecahan Masalah & Kontak" },
    },
  },
  th: {
    ui: {
      eyebrow: "คำถามที่พบบ่อย",
      title: "ทุกอย่างในที่เดียว",
      sub: "ผลิตภัณฑ์ทำอะไรได้บ้าง Lumi ทำงานอย่างไร การเรียกเก็บเงินและการแชร์ พร้อมอภิธานศัพท์",
      searchPlaceholder: "ค้นหาคำถาม คำศัพท์ หรือฟีเจอร์…",
      searchNoResults: "ไม่พบผลลัพธ์ ลองคำค้นอื่น",
      searchClear: "ล้าง",
      feedbackPrompt: "เนื้อหานี้มีประโยชน์หรือไม่?",
      feedbackHelpful: "ใช่",
      feedbackNotHelpful: "ไม่",
      feedbackThanks: "ขอบคุณสำหรับความคิดเห็น",
      contact: "ไม่พบคำถามของคุณ?",
      contactLink: "ติดต่อเรา",
    },
    sectionLabels: {
      basics: { eyebrow: "เริ่มต้นที่นี่", title: "พื้นฐาน" },
      lumi: { eyebrow: "ผลิตภัณฑ์", title: "Lumi — เอเจนต์ CS ของคุณ" },
      workspace: { eyebrow: "ผลิตภัณฑ์", title: "พื้นที่ทำงานและการส่งออก" },
      csfactors: { eyebrow: "ผลิตภัณฑ์", title: "CSFactors — ศูนย์บัญชาการ" },
      diagnostics: { eyebrow: "ผลิตภัณฑ์", title: "การวินิจฉัยและเกณฑ์มาตรฐาน" },
      editorial: { eyebrow: "ผลิตภัณฑ์", title: "บทบรรณาธิการ" },
      billing: { eyebrow: "บัญชี", title: "บัญชี การเรียกเก็บเงิน และแพ็กเกจ" },
      privacy: { eyebrow: "บัญชี", title: "ความเป็นส่วนตัวและความปลอดภัย" },
      sharing: { eyebrow: "บัญชี", title: "การแชร์และสิทธิ์ผู้อ่าน" },
      glossary: { eyebrow: "อ้างอิง", title: "อภิธานศัพท์" },
      help: { eyebrow: "ช่วยเหลือ", title: "การแก้ไขปัญหาและติดต่อ" },
    },
  },
  vi: {
    ui: {
      eyebrow: "Câu hỏi thường gặp",
      title: "Tất cả ở một nơi.",
      sub: "Sản phẩm làm gì, Lumi hoạt động ra sao, cách thanh toán và chia sẻ, cùng bảng thuật ngữ chúng tôi dùng hàng tuần.",
      searchPlaceholder: "Tìm câu hỏi, thuật ngữ hoặc tính năng…",
      searchNoResults: "Không có kết quả. Thử từ khóa khác.",
      searchClear: "Xóa",
      feedbackPrompt: "Nội dung này có hữu ích không?",
      feedbackHelpful: "Có",
      feedbackNotHelpful: "Không",
      feedbackThanks: "Cảm ơn phản hồi của bạn.",
      contact: "Không thấy câu hỏi của bạn?",
      contactLink: "Liên hệ",
    },
    sectionLabels: {
      basics: { eyebrow: "Bắt đầu", title: "Cơ bản" },
      lumi: { eyebrow: "Sản phẩm", title: "Lumi — đặc vụ CS" },
      workspace: { eyebrow: "Sản phẩm", title: "Không gian làm việc & Xuất file" },
      csfactors: { eyebrow: "Sản phẩm", title: "CSFactors — trung tâm điều hành" },
      diagnostics: { eyebrow: "Sản phẩm", title: "Chẩn đoán & Tham chiếu" },
      editorial: { eyebrow: "Sản phẩm", title: "Biên tập" },
      billing: { eyebrow: "Tài khoản", title: "Tài khoản, Thanh toán & Gói" },
      privacy: { eyebrow: "Tài khoản", title: "Quyền riêng tư & Bảo mật" },
      sharing: { eyebrow: "Tài khoản", title: "Chia sẻ & Quyền Reader" },
      glossary: { eyebrow: "Tham chiếu", title: "Bảng thuật ngữ" },
      help: { eyebrow: "Trợ giúp", title: "Khắc phục sự cố & Liên hệ" },
    },
  },
  tl: {
    ui: {
      eyebrow: "Mga Madalas Itanong",
      title: "Lahat, sa isang lugar.",
      sub: "Kung ano ang ginagawa ng produkto, paano gumagana ang Lumi, billing at pagbabahagi, at glosaryo ng mga termino.",
      searchPlaceholder: "Maghanap ng tanong, termino, o feature…",
      searchNoResults: "Walang resulta. Subukan ang ibang keyword.",
      searchClear: "Burahin",
      feedbackPrompt: "Nakatulong ba ito?",
      feedbackHelpful: "Oo",
      feedbackNotHelpful: "Hindi",
      feedbackThanks: "Salamat sa puna.",
      contact: "Hindi mo nakita ang tanong mo?",
      contactLink: "Makipag-ugnayan",
    },
    sectionLabels: {
      basics: { eyebrow: "Magsimula dito", title: "Mga Pangunahing Bagay" },
      lumi: { eyebrow: "Produkto", title: "Lumi — iyong CS agent" },
      workspace: { eyebrow: "Produkto", title: "Workspace at Exports" },
      csfactors: { eyebrow: "Produkto", title: "CSFactors — command centre" },
      diagnostics: { eyebrow: "Produkto", title: "Diagnostics at Benchmarks" },
      editorial: { eyebrow: "Produkto", title: "Editorial" },
      billing: { eyebrow: "Account", title: "Account, Billing at Tiers" },
      privacy: { eyebrow: "Account", title: "Privacy, Data at Seguridad" },
      sharing: { eyebrow: "Account", title: "Pagbabahagi at Reader Access" },
      glossary: { eyebrow: "Sanggunian", title: "Glosaryo" },
      help: { eyebrow: "Tulong", title: "Troubleshooting at Kontak" },
    },
  },
};

export function getFaqContent(locale: string): { ui: FaqUi; sections: FaqSection[] } {
  const lang = locale.split("-")[0]?.toLowerCase() ?? "en";
  const override = OVERRIDES[lang];
  if (!override) return { ui: EN_UI, sections: EN_SECTIONS };
  const ui = { ...EN_UI, ...(override.ui ?? {}) };
  const sections = EN_SECTIONS.map((s) => {
    const lab = override.sectionLabels?.[s.slug];
    if (!lab) return s;
    return { ...s, eyebrow: lab.eyebrow ?? s.eyebrow, title: lab.title ?? s.title };
  });
  return { ui, sections };
}
