export interface SampleResume {
  id: string;
  name: string;
  role: string;
  summary: string;
  text: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: "alex-fullstack",
    name: "Alex Rivera",
    role: "Full-Stack & Frontend Focus",
    summary: "CS Junior with React 19, Next.js 15, TypeScript, Node.js, and Postgres experience.",
    text: `ALEX RIVERA
Email: alex.rivera@university.edu | GitHub: github.com/alexrivera-dev | Portfolio: alexrivera.io
B.S. in Computer Science — University of Washington (Expected June 2027) | GPA: 3.82

TECHNICAL SKILLS:
Languages: TypeScript, JavaScript (ES2024), Python, SQL (PostgreSQL), HTML5, Modern CSS
Frameworks & Libraries: React 19, Next.js 15 (App Router), Tailwind CSS v4, Node.js, Express, Zustand, Framer Motion
Developer Tools & Systems: Git, Docker basics, Supabase, Vercel, RESTful APIs, Vite, Jest, Playwright

PROJECTS & EXPERIENCE:
Campus Course Planner & ERP — Lead Full-Stack Engineer (Sep 2024 – Present)
- Architected responsive web application for 4,200+ students using Next.js 15 App Router, React 19, and Tailwind CSS.
- Designed relational schema in PostgreSQL with Supabase, implementing Row Level Security and sub-50ms query latency.
- Implemented optimistic UI updates and client-side caching with Zustand, cutting interaction latency by 45%.

DevPulse — Open Source Developer Analytics Dashboard (Jan 2024 – May 2024)
- Built interactive developer productivity dashboard visualizing GitHub commit velocity using TypeScript and Tailwind CSS.
- Developed serverless API routes on Node.js fetching GraphQL telemetry from GitHub API with rate-limit backoff.
- Configured continuous integration with GitHub Actions running automated linting and Playwright end-to-end tests.

Undergraduate Teaching Assistant — Web Development & Data Structures (Jan 2024 – Dec 2024)
- Mentored 90+ students in modern JavaScript, React component design, accessibility (WCAG AA), and asynchronous state management.`
  },
  {
    id: "maya-ai-systems",
    name: "Maya Chen",
    role: "AI Systems & ML Focus",
    summary: "CS Senior with Python, LLM agent tool calling, PyTorch, RAG, and distributed systems.",
    text: `MAYA CHEN
Email: m.chen@berkeley.edu | GitHub: github.com/mayachen-ai
B.S. in Electrical Engineering & Computer Science — UC Berkeley (Expected Dec 2026) | GPA: 3.91

TECHNICAL SKILLS:
Languages: Python, TypeScript, Go basics, C++ basics, SQL
AI & Systems: LLM APIs (Anthropic, Gemini, OpenAI), Tool Calling / Agents, PyTorch, Hugging Face Transformers, LangChain/LlamaIndex, Vector Databases (Pinecone, ChromaDB), Prompt Engineering & Evaluation
Infrastructure: Docker, Linux / Bash, Git, FastAPI, gRPC, PyTest

EXPERIENCE & RESEARCH:
AI Agent Orchestration Research — Berkeley AI Research (BAIR) (May 2024 – Present)
- Designed multi-turn agent evaluation framework benchmarking tool-calling accuracy across frontier LLMs.
- Built automated verification pipelines in Python evaluating multi-step reasoning trajectories over 1,500 test cases.
- Implemented fast vector retrieval RAG harness indexing technical documentation with sub-100ms similarity lookups.

Semantic Code Search Engine (Personal Project)
- Developed terminal and web-based semantic code retrieval tool using Python, FastAPI, and Hugging Face embeddings.
- Indexed 25,000+ public GitHub repositories with AST parsing and hierarchical chunking.
- Packaged services into reproducible Docker containers with automated CI/CD testing.`
  },
  {
    id: "devon-backend-infra",
    name: "Devon Vance",
    role: "Backend & Systems Infrastructure Focus",
    summary: "CS Junior with Go, Distributed Systems, Linux, PostgreSQL, Docker, and CI/CD.",
    text: `DEVON VANCE
Email: devon.vance@gatech.edu | GitHub: github.com/dvance-sys
B.S. in Computer Science — Georgia Institute of Technology (Expected May 2027)

TECHNICAL SKILLS:
Languages: Go (Golang), Python, C++, SQL, Bash scripting
Backend & Cloud: Distributed Systems, PostgreSQL, Redis, gRPC, RESTful APIs, Docker, Linux administration, GitHub Actions
Foundations: Concurrency, Goroutines/Channels, Memory management, Network protocols (TCP/UDP, HTTP/2)

PROJECTS & EXPERIENCE:
High-Throughput Distributed Rate Limiter in Go (Oct 2024 – Jan 2025)
- Built distributed sliding-window rate limiter handling 18,000+ requests/sec with Redis cluster back-end.
- Optimized network serialization utilizing Protocol Buffers (Protobuf) and gRPC, reducing payload size by 62%.
- Wrote thorough benchmark test suites measuring p99 latency and concurrent lock contention under simulated traffic.

Cloud Infrastructure Automation Lab Assistant (Jan 2024 – Present)
- Configured multi-node Linux test clusters using Docker and Docker Compose for distributed computing assignments.
- Built automated grading pipelines using Python and Bash scripts integrated with GitHub Classroom and webhooks.
- Diagnosed container networking and memory leak bottlenecks using Linux perf and htop telemetry.`
  }
];
