<div align="center">
  <h1>Goldilocks 🧈</h1>
  <p><em>Paid pricing-oracle agent — surveys Agent Store listings, estimates demand, and recommends a statistically justified price</em></p>
  <img src="docs/assets/readme-hero.png" alt="Goldilocks — Stop guessing what to charge — get a data-backed price." width="100%">

  <br/>

  [![Built for CROO Agent Hackathon](https://img.shields.io/badge/DoraHacks-CROO_Agent_Hackathon-8b5cf6?style=for-the-badge)](https://dorahacks.io/hackathon)

  <br/>

  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=flat&logo=nodedotjs&logoColor=white)
  [![CI](https://github.com/edycutjong/goldilocks/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/goldilocks/actions/workflows/ci.yml)

</div>

---

## 📸 See it in Action

<div align="center">
  <img src="docs/assets/readme.png" alt="Goldilocks Demo" width="100%">
</div>

> **Hire Goldilocks → Get Data-Backed Price.** survey → estimate → recommend.

---

## 💡 The Problem & Solution
Every builder in this hackathon has to set a price with zero market data, on day one, on mainnet.
Price too low and you're swamped serving USDC-losing calls; price too high and your agent sits at
zero hires while the leaderboard fills up.

**Goldilocks** solves this by turning a blind guess into a recommendation grounded in what the market is actually paying.

**Key Features:**
- ⚡ **Comparable survey:** pulls public Agent Store listings in your category (price, tags, description).
- 📈 **Demand signal:** if you pass your own `agentId`, factors your fill-rate (orders vs negotiations).
- 🎯 **Recommendation:** a "just right" price + a low/high band + the 3 comps that drove it + rationale.

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20, TypeScript |
| **Agent Core** | @edycutjong/croo-core |
| **Reasoning** | Anthropic Claude 3.5 Sonnet |
| **Math** | simple-statistics |
| **Validation** | Zod |

## 🏆 Sponsor Tracks Targeted
- **Developer Tooling Agents**
- **Base Mainnet**
- **Anthropic**

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- npm

### Installation
1. Clone: `git clone https://github.com/edycutjong/goldilocks.git`
2. Install: `npm install`
3. Configure: `cp .env.example .env` and add your keys (CROO_SDK_KEY + ANTHROPIC_API_KEY)
4. Run: `npm run dev`

> **For Judges:** Skip account creation! Use test credentials if available or follow the SDK guide.

## 🧪 Testing & CI

**Quality Gates Pipeline:** Quality → Security → Build

```bash
# ── Code Quality ────────────────────────────
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm run test          # Run tests
npm run test:coverage # Coverage report
npm run ci            # Full quality gate

# ── Security ────────────────────────────────
make security-scan    # npm audit + license check
```

| Layer | Tool | Status |
|---|---|---|
| Code Quality | ESLint + TypeScript | ✅ |
| Unit Testing | Vitest | ✅ |
| Security (SAST) | CodeQL | ✅ |
| Security (SCA) | Dependabot + npm audit | ✅ |

## 📁 Project Structure
```
dorahacks-croo-goldilocks/
├── docs/              # README assets (hero, screenshots)
├── src/               # Core agent logic
├── __tests__/         # Vitest test suite
├── .env.example       # Environment template
├── .github/           # CI workflows
└── README.md          # You are here
```

## 📄 License
[MIT](LICENSE) © 2026 Edy Cu

## 🙏 Acknowledgments
Built for CROO Agent Hackathon 2026. Thank you to the sponsors for the APIs and tools.
