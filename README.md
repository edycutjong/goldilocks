# 🐻 Goldilocks — The price that's just right

<p align="center">
  <img src="docs/assets/readme-hero.png" alt="Goldilocks — Stop guessing what to charge — get a data-backed price." width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-F59E0B?style=flat-square" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/built_for-CROO_Agent_Hackathon-8B5CF6?style=flat-square" alt="Hackathon"></a>
  <a href="#"><img src="https://img.shields.io/badge/CROO_SDK-ready-8B5CF6?style=flat-square" alt="Stack"></a>\n  <a href="#"><img src="https://img.shields.io/badge/Anthropic-ready-8B5CF6?style=flat-square" alt="Stack"></a>\n  <a href="#"><img src="https://img.shields.io/badge/Base_Mainnet-ready-8B5CF6?style=flat-square" alt="Stack"></a>\n</p>


> **Track:** Developer Tooling Agents · **Network:** Base mainnet · **Settlement:** USDC via CAP
> CROO Agent Hackathon 2026

Goldilocks is a **pricing oracle for agents**. Tell it what your service does and what you charge;
it surveys comparable services on the CROO Agent Store, factors in demand signals, and recommends the
price that's *just right* — not so cheap you serve at a loss, not so pricey nobody hires you — with a
clear rationale and a confidence band.

**One line:** *stop guessing what to charge — get a data-backed price for your CROO agent.*

## Why it matters
Every builder in this hackathon has to set a price with zero market data, on day one, on mainnet.
Price too low and you're swamped serving USDC-losing calls; price too high and your agent sits at
zero hires while the leaderboard fills up. Goldilocks turns a blind guess into a recommendation
grounded in what the market is actually paying.

## What it does (one narrow flow, deep)
`hire Goldilocks (your service + current price) → market survey → {recommended, range, why}`

- **Comparable survey:** pulls public Agent Store listings in your category (price, tags, description).
- **Demand signal:** if you pass your own `agentId`, factors your fill-rate (orders vs negotiations).
- **Recommendation:** a "just right" price + a low/high band + the 3 comps that drove it + rationale.

## CROO SDK methods used (7)
`AgentClient` · `connectWebSocket` · `acceptNegotiation` · `getOrder` · `listOrders` (caller fill
data) · `listNegotiations` (demand signal) · `deliverOrder` · `rejectOrder`. Plus the public Agent
Store listings API for comparables.

## Quick start
```bash
cp .env.example .env       # CROO_SDK_KEY (+ ANTHROPIC_API_KEY for rationale)
npm install && npm test    # 100+ tests
npm run dev                # provider loop
```

## Composes with the constellation
Every other agent (and external builders) hires Goldilocks once to price itself → easy, broad buyer
base. **Gauntlet** certifies it; **Maestro** can consult it to pick the cheapest qualified worker.
See `../dorahacks-croo-core/PORTFOLIO.md`.

## Honest limitation
This is an **inaugural** event — the market is thin and young, so early recommendations lean on a
small comp set and public-listing prices (not full network-wide order history, which isn't publicly
queryable). Goldilocks reports its confidence and the comp count so you know how much data backs the
number; it gets sharper as the Agent Store grows.

— Thanks for reviewing. 🙏
