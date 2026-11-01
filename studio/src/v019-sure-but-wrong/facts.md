# V019 · Why does your chatbot guess instead of saying "I don't know"? — facts (checked 2026-11-01)

Plan row: "AI doesn't lie. It does something weirder." (Mechanism Reveal, C · How AI actually works). Rewritten as an
everyday "why does this happen to you" Short (owner 2026-10-27: dev/AI topics become everyday Shorts).

| Claim in the Short | Verdict | Source |
|---|---|---|
| Chatbots give confident wrong answers instead of saying "I don't know" (hallucinations). | confirmed | OpenAI, "Why language models hallucinate", 5 Sep 2025 (Kalai, Nachum, Vempala, Zhang et al.): https://openai.com/blog/why-language-models-hallucinate/ ; paper arXiv 2509.04664 |
| "almost never says I don't know" | confirmed for older/typical models, with a caveat | Same post, SimpleQA table from the GPT-5 system card: OpenAI o4-mini abstained on 1% of questions (75% errors); gpt-5-thinking-mini abstained 52%. Caveat shown on screen: newer models say "I don't know" more often. |
| Birthday example (asked for a birthday it cannot know → confident wrong date) | confirmed as a pattern; Spark's friend is an illustration | Same post: asked for Adam Kalai's birthday, a chatbot gave three different wrong dates; "If it guesses 'September 10', it has a 1-in-365 chance of being right. Saying 'I don't know' guarantees zero points." |
| School test analogy: a blank gets zero, a guess can sometimes be right | confirmed (the authors' own analogy) | Same post: "If you do not know the answer but take a wild guess, you might get lucky and be right. Leaving it blank guarantees a zero." |
| Chatbots are scored the same way, so they learned to guess | confirmed as the authors' explanation (one main reason, not the only one) | Same post: accuracy-only evaluations "encourage guessing rather than honesty about uncertainty"; models are "optimized to be good test-takers". The paper also traces errors to pretraining (next-word prediction on facts like birthdays with no pattern). Script keeps the scoring reason; on screen "one main reason". |
| Takeaway: check one important answer yourself | advice, not a claim | — |

Dropped: the 1-in-365 number and the SimpleQA percentages (one idea, max two numbers; none needed). "AI lies" framing
dropped (the authors say the model is not lying; it guesses). Company not named in voice; source line only.
