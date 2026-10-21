# V009 · POV: the smartest AI can't count the r's in strawberry — fact check (2026-10-21)

| Claim (as used) | Verdict | Source |
|---|---|---|
| LLMs read text as tokens (sub-word chunks), not individual letters | Confirmed | Zhang, Cao & You, "Counting Ability of LLMs and Impact of Tokenization", arXiv:2410.19730 — https://arxiv.org/pdf/2410.19730 |
| "One tokenizer sees: str, aw, berry" (GPT-4 tokenizer, cl100k: token ids 496, 675, 15717) | Confirmed (GPT-4o's tokenizer splits it differently: st · raw · berry, so the video says "one tokenizer") | https://blog.legoktm.com/2024/08/10/how-many-rs-are-in-the-word-strawberry.html ; arXiv:2412.18626 intro |
| Models said "two r's" (the famous failure) | Confirmed as a widely reported failure (2024) | https://arxiv.org/html/2412.18626v1 (cites the strawberry case) ; https://www.secwest.net/strawberry |
| Tokens are not the whole story: counting repeated letters is itself hard | Adjusted — kept as on-screen note "Tokens are one reason; counting repeats is hard too" | arXiv:2412.18626: "tokenization is not the fundamental issue"; errors correlate with letters that repeat |
| Newer models often get it right | Confirmed (reasoning models, e.g. o1, answer 3); stated as "often" | https://www.secwest.net/strawberry |
| Spelling it out first (one letter per token) helps counting | Confirmed | arXiv:2410.19730: per-item tokenization (delimited letters) beats grouped strings; legoktm (spaced letters → 3, mixed results) |
| Strawberry has three r's | Confirmed (s-t-r-a-w-b-e-r-r-y) | — |

No brand names or logos on screen; "AI" is a generic labelled figure.
