/**
 * ═══════════ ANGLICKÉ TEXTY WEBU ═══════════
 *
 * Protějšek `content/sections.ts`, `services.ts`, `projects.ts` a `contact.ts`
 * pro anglickou verzi pod `/en/`.
 *
 * ★★★ NENÍ TO PŘEKLAD, JE TO COPYWRITING. Doslovný převod českých vět zní jako
 *   strojový výstup a zabil by přesně to, co web prodává, tedy důvěryhodnost.
 *   Texty jsou psané anglicky od začátku a drží týž hlas: jeden člověk, krátké
 *   věty, konkrétní čísla, žádné "cutting-edge" ani "seamless".
 *
 * ★★ PRAVIDLA, KTERÁ PLATÍ STEJNĚ JAKO V ČESKÉ VERZI:
 *   • ŽÁDNÉ DLOUHÉ POMLČKY (—). Krátká pomlčka nebo dvojtečka.
 *   • `plateCode` MUSÍ být ASCII verzálky — vykresluje se do WebGL textury
 *     (FacePlates.tsx). Mění se dva: PROCES→PROCESS, KONTAKT→CONTACT.
 *   • `SECTIONS` musí mít PŘESNĚ ŠEST položek. Sedmá scénu shodí.
 *   • Klíče faktů na kartách projektů musí být krátké (lišta 6.5rem).
 *   • NDA platí i tady: žádné jméno klienta, žádný přesný letopočet.
 *
 * ★★★ ŽURNÁL ANGLICKY NENÍ, a `proof` sekce 01 s tím počítá: přiznává, že
 *   linka publikuje česky, a vyzývá k ověření dat a zdrojů. Hodnota té věty je
 *   v OVĚŘITELNOSTI, ne v tom, že si článek někdo přečte. Kdyby se odkaz na
 *   žurnál z anglické verze úplně vyřízl, musí se tahle věta přeformulovat —
 *   je to nejsilnější tvrzení na webu a nesmí slibovat nic, co nejde ověřit.
 *
 * ★ OTEVŘENÉ OBCHODNÍ ROZHODNUTÍ (nechal jsem doslovný převod, změna je na
 *   jeden řádek): třetí specifikace na úvodu říká "Remote or on site in
 *   Czechia", což je zeměpisný rozsah psaný pro české publikum. Jestli se
 *   zahraničními klienty pracuješ remote, správná věta je
 *   "Remote worldwide, on site across Czechia."
 */

/* eslint-disable */

/** Šest sekcí úvodní stránky. Tvar odpovídá  v content/sections.ts. */
export const SECTIONS_EN = [
    {
      "id": "ident",
      "kicker": "[ 00 / IDENT ]",
      "plateCode": "IDENT",
      "plateNum": "00",
      "headline": "Software that does the work for you.",
      "body": "I'm Jiří Bejček. I build AI systems, process automation, and custom software. You don't need to know whether you need an agent, an API, or a database. Just tell me what's eating your time today.",
      "bullets": [],
      "specs": [
        {
          "k": "One engineer, not an agency",
          "v": "You talk straight to the person who builds it and stands behind it."
        },
        {
          "k": "Fixed price and deadline",
          "v": "In writing, before I start."
        },
        {
          "k": "Reply within 24 hours",
          "v": "Weekends included. Remote or on site in Czechia."
        }
      ],
      "status": "Open capacity: 1 slot left",
      "cta": {
        "label": "Let's build something smart"
      },
      "ghostCta": {
        "label": "What I build"
      },
      "subsystem": "IDENTIFICATION"
    },
    {
      "id": "ai",
      "kicker": "[ 01 / AI ]",
      "plateCode": "AI",
      "plateNum": "01",
      "headline": "AI that actually works.",
      "body": "AI doesn't have to be a chatbot. I build it to answer from your data, show the source, and start the next step on its own.",
      "bullets": [
        "Assistants that know your documents and your processes. They answer from those, not from the internet.",
        "Extraction from contracts, invoices, orders, and resumes. The data lands straight in your system.",
        "AI agents that don't just describe a task, they run it. MCP tools and orchestration.",
        "Payback math before I write the first line. If it doesn't pay back, I turn the job down."
      ],
      "proof": "Proof: an AI pipeline I built publishes a new article on this site every day, in Czech. It can't invent a source, because it never gets the chance to. Check the dates.",
      "deliverable": {
        "label": "What you get",
        "text": "A running system wired into your tools, plus a monthly report of hours saved."
      },
      "stack": [
        "Anthropic API",
        "OpenAI API",
        "RAG",
        "MCP",
        "Vector DB",
        "Python"
      ],
      "cta": {
        "label": "Put AI to work"
      },
      "ghostCta": {
        "label": "Read the journal (Czech)"
      },
      "subsystem": "AI SYSTEMS"
    },
    {
      "id": "automatizace",
      "kicker": "[ 02 / AUTO ]",
      "plateCode": "AUTO",
      "plateNum": "02",
      "headline": "Automate the work that repeats.",
      "body": "Copying data, emails, spreadsheets, reports, retyping between systems. When a person does the same thing over and over, a machine can almost always take it over.",
      "bullets": [
        "Before: email, person, open the document, retype the data, check it, save.",
        "After: email, extraction, check, database, done. A person only approves the exceptions.",
        "n8n, APIs, webhooks, CRM. I connect the systems that don't talk to each other today."
      ],
      "deliverable": {
        "label": "What you get",
        "text": "A running workflow, the documentation, and a monthly report of hours saved."
      },
      "stack": [
        "n8n",
        "API",
        "Webhooks",
        "PostgreSQL",
        "Node.js",
        "Cron"
      ],
      "cta": {
        "label": "Automate my process"
      },
      "subsystem": "AUTOMATION"
    },
    {
      "id": "software",
      "kicker": "[ 03 / SOFTWARE ]",
      "plateCode": "SOFTWARE",
      "plateNum": "03",
      "headline": "When off-the-shelf isn't enough.",
      "body": "You shouldn't have to bend your process to fit a tool. I build internal tools, client portals, dashboards, and SaaS products around the way you already work. From an MVP that tests the idea to a product ready for thousands of customers.",
      "bullets": [
        "Internal tools and portals: documents, data, and workflow in one place.",
        "SaaS from MVP to production: accounts, subscriptions, limits, payments, admin.",
        "Dashboards: numbers you can decide on, not another export to Excel.",
        "Websites and web apps that are fast because they were built that way from day one."
      ],
      "deliverable": {
        "label": "What you get",
        "text": "A deployed app, the accounts and the code in your hands, and a plan for what comes next."
      },
      "stack": [
        "Next.js",
        "React",
        "TypeScript",
        "Node.js",
        "PostgreSQL",
        "Vercel"
      ],
      "cta": {
        "label": "Build my software"
      },
      "ghostCta": {
        "label": "See the projects"
      },
      "subsystem": "CUSTOM SOFTWARE"
    },
    {
      "id": "proces",
      "kicker": "[ 04 / PROCESS ]",
      "plateCode": "PROCESS",
      "plateNum": "04",
      "headline": "From an idea to a working product.",
      "body": "You don't need a technical spec. One sentence is enough: “we do this by hand” or “we want to build this”.",
      "bullets": [],
      "steps": [
        {
          "title": "Discovery",
          "text": "A free half-hour call. I find out what you need. And more to the point, what you don't."
        },
        {
          "title": "Proposal",
          "text": "The solution, the architecture, and a fixed price. In writing, before anything starts. If the scope changes, you know the price up front."
        },
        {
          "title": "Build",
          "text": "I ship as I go. You see a running version, not slides about a running version."
        },
        {
          "title": "Run and improve",
          "text": "Monitoring, changes, new features. I don't disappear the moment the invoice goes out."
        }
      ],
      "cta": {
        "label": "Book a free call"
      },
      "subsystem": "WORKFLOW"
    },
    {
      "id": "kontakt",
      "kicker": "[ 05 / CONTACT ]",
      "plateCode": "CONTACT",
      "plateNum": "05",
      "headline": "Tell me what you need solved.",
      "body": "You don't need to know the technology or have a spec. Describe the problem in your own words and within 24 hours you'll know what it costs and when it's done.",
      "bullets": [],
      "cta": {
        "label": "Send me your problem"
      },
      "subsystem": "CONTACT"
    }
  ] as const

/** Katalog na /en/services. Tvar odpovídá SERVICE_GROUPS v content/services.ts. */
export const SERVICE_GROUPS_EN = [
    {
      "num": "01",
      "code": "AI SYSTEMS",
      "title": "AI wired into your business.",
      "lead": "Five ways AI can work with what your company already has, and it shows you where every answer came from.",
      "items": [
        {
          "k": "AI assistants",
          "v": "Internal assistants that know your documents, your processes, and your information."
        },
        {
          "k": "Document processing",
          "v": "Automatic extraction from contracts, invoices, orders, and resumes."
        },
        {
          "k": "AI over company data",
          "v": "Search your internal knowledge in plain language, with the source cited."
        },
        {
          "k": "Agents and workflows",
          "v": "AI that doesn't just answer, it carries the task out. MCP tools, orchestration."
        },
        {
          "k": "Custom AI",
          "v": "Built around your process, not around a tool's template."
        }
      ],
      "punch": "AI isn't the goal. The goal is work a person no longer has to do.",
      "anchor": "ai"
    },
    {
      "num": "02",
      "code": "AUTOMATION",
      "title": "The manual steps a machine can take over.",
      "lead": "Four places where a repeated procedure can be handed to a machine.",
      "items": [
        {
          "k": "Data extraction and entry",
          "v": "From an email, PDF, or form straight into the system, with no retyping."
        },
        {
          "k": "System integration",
          "v": "APIs, webhooks, and databases. Tools that don't talk to each other today start talking."
        },
        {
          "k": "Checks and watchdogs",
          "v": "Regular verification of data, statuses, and deadlines. A warning before something breaks."
        },
        {
          "k": "Reports",
          "v": "The document you assemble by hand today shows up on its own, at the same time every time."
        }
      ],
      "punch": "Less manual work, fewer mistakes, and a record of what happened when.",
      "anchor": "automatizace"
    },
    {
      "num": "03",
      "code": "INTERNAL TOOLS",
      "title": "Software shaped around the way you work.",
      "lead": "Sometimes it costs less to build a tool around the process than to bend the process around a tool.",
      "items": [
        {
          "k": "Internal tools",
          "v": "Processing company data, generating documents, running workflows."
        },
        {
          "k": "Client portals",
          "v": "Documents, messages, services, and information in one place."
        },
        {
          "k": "Dashboards",
          "v": "Data turned into an interface you can decide from."
        },
        {
          "k": "CRM and internal systems",
          "v": "Records that fit how the company actually runs, not the other way around."
        }
      ],
      "punch": "Your workspace. Your rules. Your software.",
      "anchor": "software"
    },
    {
      "num": "04",
      "code": "SAAS",
      "title": "Got a product idea? Let's build it.",
      "lead": "SaaS isn't a web app, it's a product: one customer, or thousands.",
      "items": [
        {
          "k": "MVP",
          "v": "A fast check on whether the idea holds up, before the budget sinks into it."
        },
        {
          "k": "Product development",
          "v": "A real product ready for customers, not a prototype running in production."
        },
        {
          "k": "AI inside the product",
          "v": "Not a marketing add-on, but the feature the customer buys it for."
        },
        {
          "k": "Subscriptions and accounts",
          "v": "Users, plans, limits, and a payment gateway."
        },
        {
          "k": "Admin",
          "v": "User management, stats, and control over the whole product."
        }
      ],
      "punch": "A product doesn't end at the first release. I build it so it can grow.",
      "anchor": "software"
    },
    {
      "num": "05",
      "code": "DATA PRIVACY",
      "title": "Sensitive data doesn't have to stand between you and AI.",
      "lead": "Sensitive documents go through detection and anonymization before the next system or model ever sees them.",
      "items": [
        {
          "k": "Detecting personal data",
          "v": "Names, addresses, phone numbers, emails, and ID numbers, in plain text and in documents."
        },
        {
          "k": "Anonymization and pseudonymization",
          "v": "Data gets removed or replaced with a placeholder, depending on what you still need to do with it."
        },
        {
          "k": "Processing on your side",
          "v": "The sensitive part of the work can run on your own machines, and only what no longer holds personal data leaves them."
        }
      ],
      "punch": "Privacy shouldn't be the obstacle. I set the level of protection to match the type of data."
    },
    {
      "num": "06",
      "code": "WEB",
      "title": "A website that isn't just a business card.",
      "lead": "Speed isn't a line item at the end of the quote, it's an architecture decision: what loads before the text does.",
      "items": [
        {
          "k": "Company websites",
          "v": "A presentation of your brand, service, or product that holds up next to the competition."
        },
        {
          "k": "Landing pages",
          "v": "One page built for a single goal: getting the visitor to act."
        },
        {
          "k": "Web apps",
          "v": "Bigger products connected to your data and your systems."
        },
        {
          "k": "E-commerce",
          "v": "Online sales wired into payments and everything that follows the order."
        },
        {
          "k": "SEO and performance",
          "v": "The technical base for speed, indexing, and long-term visibility."
        }
      ],
      "punch": "The site you're reading right now scores 100 out of 100 on desktop Lighthouse in all four categories. Don't take my word for it. Measure it.",
      "anchor": "software"
    }
  ] as const

export const CERTIFICATE_EN = {
    "title": "Agentic Engineering",
    "issuer": "r_d by Laba",
    "topics": [
      "AI agent architecture and principles",
      "Working with Codex, Claude, and Copilot",
      "Building and integrating MCP tools",
      "Controlling AI agents programmatically",
      "Full-stack application development with AI",
      "Agent orchestration through the SDK"
    ],
    "facts": [
      {
        "k": "Scope",
        "v": "20 class hours, 10 lessons"
      },
      {
        "k": "Issued",
        "v": "May 29, 2026"
      },
      {
        "k": "Verification",
        "v": "QR code inside the document"
      }
    ]
  } as const

export const TECH_STACK_EN = [
    {
      "group": "AI",
      "items": [
        "Anthropic API",
        "OpenAI API",
        "LLM",
        "AI agents",
        "RAG",
        "MCP"
      ]
    },
    {
      "group": "Development",
      "items": [
        "Next.js",
        "React",
        "TypeScript",
        "Node.js",
        "Python"
      ]
    },
    {
      "group": "Data",
      "items": [
        "PostgreSQL",
        "Prisma",
        "Supabase",
        "Vector DBs"
      ]
    },
    {
      "group": "Automation",
      "items": [
        "n8n",
        "API",
        "Webhooks",
        "Cron"
      ]
    },
    {
      "group": "Operations",
      "items": [
        "Vercel",
        "Docker",
        "Cloud",
        "Git"
      ]
    }
  ] as const

/** Texty zadrátované ve ServicesPage.tsx. */
export const SERVICES_PAGE_EN = {
    "skipLink": "Skip to projects",
    "kicker": "[ PROJECTS ]",
    "h1": "The sites are live. The names stay confidential.",
    "lead": "Client work is shown in outline only: a blurred screenshot, the field, and the technical facts. That is as far as the NDA lets me go.",
    "note": {
      "k": "Why the locks",
      "text": "Discretion isn't an obstacle, it's part of the service. The same agreement that covers these clients today will one day cover you: your site, your numbers, your data."
    },
    "cta": {
      "h2": "I'll show you the references in full. Face to face.",
      "body": "Tell me what you're building, in your own words. Within 24 hours you'll know whether I'm the right person for it, what it will cost, and when it will be done. And I'll open the portfolio up for you: live sites, names, results.",
      "buttons": {
        "email": "Send an email",
        "whatsapp": "WhatsApp"
      },
      "trust": "No obligation · Reply within 24 hours · Discreet"
    }
  } as const

/** ★ Reference. NDA platí i v angličtině: žádné jméno, doména ani letopočet. */
export const PROJECTS_EN = [
    {
      "id": "ref-01",
      "name": "Legal services priced up front",
      "kind": "Law firm site with online ordering",
      "summary": "A law firm sells legal work over the internet. The client picks their situation, sees the price before ordering, and the case goes straight to an attorney.",
      "facts": [
        {
          "k": "Delivery",
          "v": "Pages prerendered to a CDN (ISR), not assembled on the server on every request"
        },
        {
          "k": "Search",
          "v": "LegalService structured data, including the firm's contact details and address"
        },
        {
          "k": "Languages",
          "v": "hreflang on the translated versions, so they don't compete with each other in results"
        },
        {
          "k": "Images",
          "v": "WebP, with lazy loading below the fold"
        }
      ],
      "shot": {
        "alt": "Deliberately blurred screenshot of a law firm home page with pricing and an order flow; the details of this reference are covered by an NDA."
      }
    },
    {
      "id": "ref-02",
      "name": "Law firm, Prague",
      "kind": "Firm profile site with a legal advice section",
      "summary": "An established Prague firm: practice areas, the team, a blog, a free first consultation. The site has one job, which is to get a visitor to their practice area before they leave for someone else.",
      "facts": [
        {
          "k": "Search",
          "v": "Common questions in structured data, so they can show up in the result itself"
        },
        {
          "k": "Languages",
          "v": "hreflang on the second language version"
        },
        {
          "k": "Privacy",
          "v": "A cookie consent you can actually decline, not just click through"
        },
        {
          "k": "Images",
          "v": "WebP and lazy loading"
        }
      ],
      "shot": {
        "alt": "Deliberately blurred screenshot of a law firm home page; the details of this reference are covered by an NDA."
      }
    },
    {
      "id": "ref-03",
      "name": "Fashion brand, USA",
      "kind": "Brand site for a made-to-measure studio",
      "summary": "A US brand that makes clothing to measure. The site runs on imagery, not copy: full-width video and animation driven by scroll.",
      "facts": [
        {
          "k": "Concept",
          "v": "Full-width video hero, with content animating in as you scroll"
        },
        {
          "k": "Delivery",
          "v": "Cloudflare, so the edge network sits close to US customers"
        },
        {
          "k": "Language",
          "v": "English, built for a market outside the Czech Republic"
        }
      ],
      "shot": {
        "alt": "Deliberately blurred screenshot of a fashion brand home page with large photography; the details of this reference are covered by an NDA."
      }
    },
    {
      "id": "bejcekit",
      "name": "bejcek.it",
      "domain": "this site",
      "kind": "Portfolio with a 3D scene in the browser",
      "summary": "The site you are on right now. The glass machine in the middle is not an image. It is a scene computed in your browser, with the camera orbiting it as you scroll.",
      "facts": [
        {
          "k": "Speed",
          "v": "Lighthouse 100 / 100 / 100 / 100 on desktop. Run it yourself."
        },
        {
          "k": "Resilience",
          "v": "On a weak machine the scene steps down a level on its own, and gives up entirely if it has to. The site stays whole."
        },
        {
          "k": "Stability",
          "v": "CLS 0. Not one pixel of the layout hangs off the 3D."
        },
        {
          "k": "Loading",
          "v": "three.js downloads only after the text is painted, so nobody ever waits to start reading."
        }
      ],
      "shot": {
        "alt": "Home screen of bejcek.it: the headline over the glass machine rendered live in the browser."
      }
    }
  ] as const

export const LOCKED_DOMAIN_EN = "confidential client"

/** Štítky karty projektu (plomba NDA, živá ukázka, texty pro odečítač). */
export const PROJECT_CARD_EN = {
    "ndaSeal": "Under NDA",
    "detailOnRequest": "Details on request",
    "live": "live site",
    "outcome": "Result",
    "srLocked": " (under NDA, details on request)",
    "srExternal": " (opens in a new tab)"
  } as const

/** Kontaktní stránka: pole formuláře, kanály, kroky, časté dotazy, hlášky. */
export const CONTACT_EN = {
    "_file": "src/content/contact.ts + src/ContactPage.tsx",
    "constants": {
      "CONTACT_PATH": "/kontakt",
      "CONTACT_ENDPOINT": "/api/contact",
      "HONEYPOT_FIELD": "website",
      "_note": "Left unchanged on purpose. Path and query keys (?odeslano=1, ?chyba=...) are hardcoded in api/contact.ts and the sitemap; renaming them is a routing change, not copy. Suggested English routing if you decide to do it in a separate pass: /contact, ?sent=1, ?error=..."
    },
    "INQUIRY_KINDS": [
      {
        "value": "ai",
        "label": "AI for my business"
      },
      {
        "value": "automatizace",
        "label": "Process automation"
      },
      {
        "value": "software",
        "label": "Custom software"
      },
      {
        "value": "web",
        "label": "Website or app"
      },
      {
        "value": "nevim",
        "label": "Not sure yet"
      }
    ],
    "CONTACT_CHANNELS_PAGE": [
      {
        "label": "WhatsApp",
        "note": "Fastest. One sentence is enough."
      },
      {
        "label": "Phone",
        "note": "You get me directly. Nobody transfers the call."
      },
      {
        "label": "Email",
        "note": "If you'd rather write from your own inbox."
      }
    ],
    "WHAT_HAPPENS": [
      {
        "k": "Within 24 hours",
        "v": "I answer you personally. Weekends included."
      },
      {
        "k": "A 30-minute call",
        "v": "Free, no strings attached. I'll work out what you need and what you don't."
      },
      {
        "k": "Price and timeline",
        "v": "In writing, before I start. If the scope changes, you know the price up front."
      }
    ],
    "CONTACT_FAQ": [
      {
        "q": "What will it cost?",
        "a": "You get the price in writing up front, after a free 30-minute call. Smaller automations start in the tens of thousands of CZK, custom software depends on scope. If the scope changes while I work, you know the new price before I start on the change."
      },
      {
        "q": "Do I need to know exactly what I want?",
        "a": "No. One sentence is enough: “we do this by hand” or “this keeps slowing us down.” Writing the technical spec is my job, not yours."
      },
      {
        "q": "How long does it take?",
        "a": "Smaller automations take a few weeks, custom software months. I ship continuously, so you see a running version before everything is finished."
      },
      {
        "q": "Where are you based?",
        "a": "Prague, Czech Republic. Most of the work runs remotely, and I come to meetings in person when it makes sense."
      },
      {
        "q": "What if you're not the right person for it?",
        "a": "I'll tell you straight and point you to someone who is. I don't take work that won't pay for itself."
      },
      {
        "q": "Who owns the finished code?",
        "a": "You do. You get the code, the access, and the documentation. You're not dependent on me and I don't hold a key anywhere."
      }
    ],
    "page": {
      "skipLink": "Skip to the form",
      "kicker": "[ CONTACT ]",
      "h1": "Tell me what you need solved.",
      "lead": "You don't need to know the technology or have a spec. Describe the problem in your own words. Within 24 hours you'll know what it costs and when it will be done.",
      "formHeading": "Send me a message",
      "honeypotLabel": "Please leave this empty",
      "fields": {
        "nameLabel": "Name",
        "namePlaceholder": "Jane Doe",
        "emailLabel": "Email",
        "emailPlaceholder": "jane@company.com",
        "companyLabel": "Company",
        "companyPlaceholder": "Acme Inc.",
        "optionalTag": "optional",
        "kindsLegend": "What do you need help with?",
        "messageLabel": "What do you need solved?",
        "messagePlaceholder": "For example: every day we retype orders from emails into our system by hand. It takes two hours a day and we keep making mistakes."
      },
      "submit": "Send inquiry",
      "submitSending": "Sending…",
      "trust": "No obligation · Reply within 24 hours · Confidential",
      "ok": {
        "badge": "Sent",
        "textBefore": "Thanks. I'll get back to you within 24 hours, weekends included. If it's urgent, message me on ",
        "linkLabel": "WhatsApp",
        "textAfter": "."
      },
      "sideHeadings": {
        "channels": "Or reach me directly",
        "steps": "What happens next"
      },
      "faqHeading": "Before you write",
      "faqMoreBefore": "Didn't find your answer? Email ",
      "faqMoreAfter": "."
    },
    "URL_ERRORS": {
      "jmeno": "Please enter your name.",
      "email": "That address doesn't look valid.",
      "zprava": "Please write at least ${LIMITS.message.min} characters so I know what this is about.",
      "limit": "Too many messages came from one address. Try again in a bit, or reach me directly.",
      "konfigurace": "The form isn't set up right now. Please email me or message me on WhatsApp.",
      "odeslani": "The message couldn't be sent. Please try again, or message me on WhatsApp.",
      "obecna": "Something went wrong. Please try again, or reach me directly.",
      "_networkCatch": "Couldn't reach the server. Please try again, or message me on WhatsApp."
    },
    "apiMessages": {
      "_note": "Same strings live in api/contact.ts and are shown verbatim in the form. Included so the two don't drift apart.",
      "metoda": "Use POST.",
      "telo": "Couldn't read the form data.",
      "jmeno": "Please enter your name.",
      "email": "That address doesn't look valid.",
      "zpravaShort": "Please write at least ${LIMITS.message.min} characters so I know what this is about.",
      "zpravaLong": "That message is too long.",
      "limit": "Too many messages came from one address. Try again in a bit, or email me directly.",
      "konfigurace": "The form isn't set up right now. Please email me or message me on WhatsApp.",
      "odeslani": "The message couldn't be sent. Please try again, or message me on WhatsApp."
    }
  } as const

/** Rozhraní: navigace, patičky, stavový panel, preloader, úchop, certifikát. */
export const UI_EN = {
    "nav": {
      "_files": "src/hud/Hud.tsx, src/ui/PageShell.tsx, src/content/sections.ts (NAV_PAGES)",
      "NAV_PAGES": [
        {
          "href": "/sluzby",
          "label": "SERVICES",
          "title": "Services"
        },
        {
          "href": "/projekty",
          "label": "WORK",
          "title": "Work"
        },
        {
          "href": "/clanky",
          "label": "JOURNAL",
          "title": "Journal"
        }
      ],
      "cta": "Get in touch",
      "ariaLabel": "Main navigation",
      "markSrOnly": "bejcek.it, home",
      "railAriaLabel": "Sections"
    },
    "skipLinks": {
      "toContent": "Skip to content",
      "toForm": "Skip to the form"
    },
    "footer": {
      "_files": "src/ui/PageShell.tsx (subpages), src/ui/Section.tsx (home)",
      "home": "Home",
      "contact": "Contact",
      "work": "Work",
      "copyright": "© {year} Jiří Bejček",
      "legal": {
        "_rule": "CC BY 4.0 needs all four parts: title, author, license with link, statement that the work was modified. All four are present below.",
        "beforeTitleLink": "Built with React and three.js. 3D model ",
        "titleLink": "“Primary Ion Drive”",
        "betweenTitleAndLicense": " by Mike Murdock, licensed under ",
        "licenseLink": "CC BY 4.0",
        "afterLicense": ". The model has been modified (material colors, geometry compression).",
        "_flat": "Built with React and three.js. 3D model “Primary Ion Drive” by Mike Murdock, licensed under CC BY 4.0. The model has been modified (material colors, geometry compression)."
      }
    },
    "contactBlock": {
      "_file": "src/ui/Section.tsx (section 05 on the home page)",
      "emailLabel": "Email",
      "emailNote": "I reply within 24 hours, weekends included.",
      "copyIdle": "Copy address",
      "copyDone": "Copied"
    },
    "status": {
      "_file": "src/hud/Status.tsx",
      "transit": ">> transit {i} → {next}",
      "head": "unit 06 · face {i}/05 · {plateCode}",
      "rows": [
        {
          "k": "Open capacity",
          "v": "1 slot left"
        },
        {
          "k": "Response",
          "v": "Within 24 hours"
        }
      ],
      "metaOff": "static mode · 3d off",
      "metaLive": "{fps} fps · tier {tier} · meshopt · model cc-by m. murdock"
    },
    "preloader": {
      "_file": "src/ui/Preloader.tsx",
      "srOnly": "Loading 3D scene: {progress}%"
    },
    "grabHint": {
      "_file": "src/ui/GrabPlate.tsx",
      "pointer": "drag to turn",
      "touch": "swipe sideways"
    },
    "bullSeal": {
      "_file": "src/ui/BullSeal.tsx",
      "ariaLabel": "The bejcek.it mark: a metal bull with glowing blue edges, slow loop."
    },
    "certificate": {
      "_file": "src/ui/Certificate.tsx",
      "imgAlt": "{title} certificate issued by {issuer} to Jiří Bejček, 20 hours of instruction.",
      "openLink": "Open certificate",
      "kicker": "Verified credential",
      "topicsLead": "What the course covered:",
      "alsoInServicesTs": {
        "_note": "src/content/services.ts (CERTIFICATE) may belong to another pass. Included so the component and its data don't end up half translated. Title and issuer are proper names and stay as they are.",
        "title": "Agentic Engineering",
        "issuer": "r_d by Laba",
        "topics": [
          "AI agent architecture and principles",
          "Working with Codex, Claude, and Copilot",
          "Building and integrating MCP tools",
          "Programmatic control of AI agents",
          "Full-stack app development with AI",
          "Agent orchestration via SDK"
        ],
        "facts": [
          {
            "k": "Length",
            "v": "20 hours of instruction, 10 lessons"
          },
          {
            "k": "Issued",
            "v": "May 29, 2026"
          },
          {
            "k": "Verification",
            "v": "QR code in the document itself"
          }
        ]
      }
    }
  } as const
