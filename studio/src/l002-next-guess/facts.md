# L002 · ChatGPT Doesn't Know What It's Going to Say Next — fact check (2026-10-23)

| # | Claim (as spoken / shown) | Verdict | Primary source |
|---|---|---|---|
| 1 | Models like GPT-4 are "pre-trained to predict the next token" (quoted on screen) | Confirmed (exact abstract wording) | OpenAI, *GPT-4 Technical Report* (2023), arXiv:2303.08774 — https://arxiv.org/abs/2303.08774 |
| 2 | Text is split into tokens: chunks that can be whole words or pieces of words | Confirmed | OpenAI Help Center, "What are tokens and how to count them?" — https://help.openai.com/en/articles/4936856 |
| 3 | In English, 1 token ≈ 4 characters ≈ ¾ of a word; 100 tokens ≈ 75 words | Confirmed ("1 token ~= 4 chars in English", "1 token ~= ¾ words", "100 tokens ~= 75 words"); said "in English" (the page notes ratios are language-dependent) | same OpenAI Help page |
| 4 | Each chunk becomes a number; the model only sees the numbers | Confirmed in principle (token IDs); on-screen IDs labelled "Illustrative ID numbers"; the on-screen split "un · believ · ably" labelled "Illustration: real splits vary by tokenizer" | OpenAI Help page (tokenization); V009 facts |
| 5 | One tokenizer splits "strawberry" as str · aw · berry; that's one reason letter counting trips models up | Confirmed (GPT-4 cl100k tokenizer: 496, 675, 15717); "one reason" kept because counting repeated letters is also hard | V009 facts.md: https://blog.legoktm.com/2024/08/10/how-many-rs-are-in-the-word-strawberry.html ; Zhang et al. 2024 arXiv:2410.19730 ; arXiv:2412.18626 |
| 6 | It scores the options, picks one chunk, appends it, and runs again (the next-token loop; streaming text) | Confirmed (autoregressive generation follows from next-token prediction, #1); bar values labelled "Illustrative scores" | GPT-4 Technical Report; Vaswani et al. 2017 (decoder is auto-regressive, "consuming the previously generated symbols as additional input") |
| 7 | "It doesn't draft the answer, then reveal it. Each chunk is locked in the moment it's picked." | Confirmed as a description of sampling (each sampled token is committed and fed back). Deliberately NOT claimed: "it never plans ahead internally" (interpretability work suggests some internal look-ahead) | as #6 |
| 8 | 2017 paper "Attention Is All You Need"; attention lets each word weigh the other words | Confirmed: "based solely on attention mechanisms" | Vaswani et al. (2017), arXiv:1706.03762 — https://arxiv.org/abs/1706.03762 |
| 9 | It ditched the older read-one-word-at-a-time (recurrent) designs | Confirmed: "dispensing with recurrence and convolutions entirely" | same |
| 10 | Trained in 3.5 days on eight GPUs; a translation model, not ChatGPT | Confirmed: "41.8 after training for 3.5 days on eight GPUs" on WMT 2014 English-to-French; caution respected (said "a translation model… not ChatGPT") | same |
| 11 | The T in GPT stands for Transformer (Generative Pre-trained Transformer) | Confirmed | OpenAI GPT naming; GPT-4 report ("a Transformer-based model") |
| 12 | Trophy/suitcase sentence: attention is how a model *can* link "it" to "trophy" | Illustration of the mechanism (Winograd-style example); beam weights labelled as illustration; phrased "can" (no claim about a specific model) | Vaswani et al. 2017 (concept) |
| 13 | Temperature: low = safer, likely picks; high = surprising picks; OpenAI's API allows 0 to 2 | Confirmed: API reference "What sampling temperature to use, between 0 and 2" (higher = more random) | OpenAI API reference (quoted at https://community.openai.com/t/is-temperature-ranging-from-0-to-1-or-0-to-2/193581) |
| 14 | Same prompt at two temperatures: "mat" vs "moon, in tiny jazz shoes" | Illustration (labelled on screen) | — |
| 15 | 2025: OpenAI researchers wrote that training and evaluation reward guessing over acknowledging uncertainty | Confirmed: "the training and evaluation procedures reward guessing over acknowledging uncertainty" | Kalai, Nachum, Vempala, Zhang (2025), *Why Language Models Hallucinate*, arXiv:2509.04664 ; https://openai.com/index/why-language-models-hallucinate/ |
| 16 | Scoreboard: a guess may score, "not sure" scores 0 | Confirmed as the paper's argument about binary grading (shown as "maybe +1" vs 0) | same |

Cautions applied: no parameter counts; neither "it understands" nor "it understands nothing"; token ratios said for English only;
the 3.5 days / 8 GPUs result attributed to the 2017 translation model; no logos (ChatGPT/GPT named in text only, no marks).
Risk flag: none (AI explainer). Profanity: none (brief said none).
