# 11 — AI Strategy: Using AI Well (Antigravity with Gemini Fast/Pro, limited Opus)

> AI is allowed and "expected." But the interview brief explicitly warns: "Blind copy-pasting AI output without validation is a negative signal." So the bar is: **AI is a tool you drive, not an oracle you defer to.** This doc covers how to leverage AI for max signal without footguns.

---

## The mental model: AI is a fast junior with infinite confidence

Treat every AI response as if a confident junior dev handed it to you with no context. They are:
- Fast.
- Knowledgeable in breadth (boilerplate, syntax, common patterns).
- **Unreliable on specifics** of your codebase.
- Will invent functions / files / APIs that don't exist (hallucination).
- Will write plausible code that subtly violates the existing conventions.

You **review** their output the way you'd review a PR: with skepticism and verification.

---

## The senior signal: visible AI workflow

The interviewer is watching how you use AI. They want to see:

1. **You ask AI focused, well-scoped questions.** ("What are the common failure modes of this useEffect dep array?" — not "fix this bug").
2. **You read the output critically.** You don't paste; you understand.
3. **You verify with the actual code/docs.** "AI said `useDeferredValue` debounces — let me check the React docs to confirm semantics."
4. **You override AI when it's wrong.** Out loud: "AI suggested this, but it'd break X in our setup, so I'm doing Y instead."

If you accept everything AI says, you look junior. If you visibly drive, you look senior.

---

## Antigravity / Gemini specifics

Antigravity is Google's IDE (analogous to Cursor). You'll likely have:
- **Gemini Fast** (cheap, default) — good for explanation, scaffolding, syntax lookup.
- **Gemini Pro** (better reasoning) — bug hunting, architectural review.
- **Opus** (limited calls) — save for the hardest questions.

### Triage by model
- "Explain this file in 5 bullets" → Fast.
- "What could go wrong in this useEffect?" → Fast or Pro.
- "Trace this race condition through these 3 files" → Pro.
- "Design a fix that handles cancellation, race conditions, and double-submit" → Opus or Pro.

**Don't burn Opus calls on syntax.** Spend them on reasoning that benefits from depth.

### Antigravity IDE caveats
- Inline completions may misread context. Verify before accepting.
- "Apply edit" buttons can change more than you expect — diff before accepting.
- The agent mode (if you have it) can make multi-file changes. Review every one.

---

## Where AI helps in this interview

### Part 1 (Code Review)

Good prompts:
- "Summarize what this file does in 5 bullets."
- "What are the top 5 risks in this component (correctness, security, perf)?"
- "Is there a race condition in this useEffect when [params] change?"
- "What edge cases does this validation miss?"

Use AI as a **second pair of eyes** — generate findings, then verify each one against the code. Your job: filter signal from noise, prioritize, and present.

**Anti-pattern:** asking AI "review this code" and pasting its bullet list as your review. Half of it will be generic ("consider adding tests"), half will miss the actual risk.

### Part 2 (Code change)

Good prompts:
- "Write a vitest test that asserts the filter applies when the user types." (you understand and adapt)
- "What's the AbortController pattern for canceling fetch in useEffect cleanup?" (syntax lookup)
- "What's the type signature for React.memo with generics?" (TS edge case)

**Generate scaffolding, then edit it yourself.** Don't accept code that touches lines you don't understand.

### Things to NOT do

- "Fix this bug" with no analysis from you first.
- Accept a multi-file diff without reading each file.
- Use AI's first answer without sanity-checking against a real source (the actual code, MDN, React docs).
- Argue with the interviewer based on AI output ("the AI said it's fine").

---

## Prompt patterns that work

### Pattern: contextual diagnosis
Bad: "Why is this slow?"

Good:
> "This list renders ~500 items. The filter input is laggy. I see the filter function is recomputed each keystroke. The list isn't virtualized. The Provider value isn't memoized. Which of these is most likely the dominant cause? How would I verify with React DevTools?"

You bring the analysis; AI helps you prioritize and verify.

### Pattern: explicit constraint
> "Show me how to refactor this without changing the component's public API or its tests. Match the existing style of using useState rather than useReducer."

Constraints prevent AI from rewriting more than you wanted.

### Pattern: counter-prompt
After AI gives an answer:
> "What's wrong with that approach? What edge cases does it miss?"

AI is much better at critiquing its own work when prompted. This reveals failure modes you'd otherwise miss.

### Pattern: docs-grounded
> "What does the React docs say about useDeferredValue vs useTransition?"

Forces grounding. Then verify against the actual docs.

### Pattern: explain
> "Walk me through what happens, line by line, when the user clicks 'Submit' on this form."

If the AI can't explain it cleanly, you don't understand it well enough either.

---

## Verifying AI output (the must-do checklist)

Before accepting any AI-generated code:

- [ ] **Reference check** — do all imports / functions / methods actually exist? (AI hallucinates names.)
- [ ] **Style check** — does it match the codebase conventions?
- [ ] **Edge cases** — what happens if the data is empty / fails / arrives twice?
- [ ] **Test it** — run the test suite + manually trigger the path.
- [ ] **TS check** — does the type checker pass? `any`s introduced?
- [ ] **Diff scope** — did it change only what I asked, or did it "improve" unrelated code?

The most common AI failure is "looks right but cites an API that doesn't exist." Always verify the API.

---

## Specific AI footguns to watch for

### Hallucinated APIs
AI invents `React.useTimeout`, `useEffectAsync`, `useFetch` (without importing a library). Always check the import resolves.

### Outdated patterns
AI may default to class components, `componentDidMount`, or pre-hooks Redux boilerplate. Steer it to modern.

### Wrong library version
AI may write `react-router v5` API (`<Switch>`, `useHistory`) when you're on v6. State the version in your prompt.

### Silent over-edits
"Apply edit" tools rewriting more than the targeted block. Always diff before saving.

### Generic security advice
AI may say "validate input" without saying how, or "sanitize" without naming DOMPurify. Push for specifics.

### Confident wrong types
AI writes types that compile but model the wrong invariants. Verify the type matches the runtime data shape.

---

## A worked example of using AI well

**You see this code in review:**

```jsx
function ItemList({ items }) {
  const [filter, setFilter] = useState('');
  useEffect(() => {
    setFilter(''); // reset filter when items change
  }, [items]);

  return (...);
}
```

**Step 1: Form your own hypothesis.**
> "Resetting filter inside an effect feels wrong. The filter resets on every parent render if `items` is a new reference. Could be a bug."

**Step 2: Ask AI to validate AND counter.**
> "Is there a bug in resetting filter inside useEffect based on [items] dep? Consider what happens if the parent renders frequently and items reference changes each render."

**Step 3: Verify by inspection.**
Read the parent. Is `items` memoized? If not, you have a flickering bug.

**Step 4: Decide and act, with reasoning out loud.**
> "I traced this up to the parent — `items` is a `.filter()` result, recreated every render. So this effect resets the filter on every parent render. Either I memoize items in the parent, or I lift the filter state up, or I check by id rather than reference."

The AI gave you a possible angle. The reasoning and decision is yours.

---

## When NOT to use AI in the interview

- When you don't know what to ask. Take 60 seconds to scan the code first; form a question.
- When you'd accept the output without reading it. That's blind copying.
- When the answer requires deep codebase context AI can't see (architectural decisions).
- When you're already 80% there. Finish the thought yourself — interruptions slow you down and break flow.
- When the interviewer asks you a direct question. Don't make them watch you query AI for "what is useMemo." Answer from your head; verify edge cases with AI later.

---

## A 30-second AI-usage decision tree

> "Should I use AI for this right now?"

1. Do I have a specific question? If no → think first.
2. Will I read the entire output and verify each claim? If no → don't ask.
3. Would I be embarrassed to paste this verbatim into prod? If yes → don't accept verbatim.
4. Could I get the answer faster from the file / docs in front of me? If yes → look there first.

---

## Communicating about AI in the interview

**Good:**
> "Let me ask Gemini to summarize this file so I can orient faster — I'll verify against the actual code."

> "AI suggested adding useCallback here, but I don't see a memoized child consumer, so it's just overhead. Skipping."

> "Gemini's first answer to this didn't handle the cleanup case — I'll iterate the prompt with that constraint."

**Bad:**
> "The AI said it works."

> [Silence while typing into AI chat for 2 minutes, then pasting.]

> [Accepting an AI diff that crosses three files without reading.]

---

## Pre-interview AI sanity check (do this 30 minutes before)

1. **Confirm Antigravity is open and logged in.**
2. **Run a quick sanity prompt** to confirm the AI works: "Hello, can you read my open files?"
3. **Test inline completions** on a sample file. Make sure you can accept/reject.
4. **Confirm model switching** between Fast/Pro/Opus works.
5. **Have a fallback** — claude.ai or chatgpt.com tab open just in case.

---

## TL;DR

1. **You drive. AI assists.**
2. **Ask specific questions.** Generic in, generic out.
3. **Verify every claim.** Especially API names.
4. **Save Opus for hard reasoning.** Don't burn it on syntax.
5. **Narrate your AI use.** It signals you're driving, not deferring.
6. **Never accept code you don't understand.**
7. **If the AI is slow or wrong, move on.** Don't burn 5 minutes prompting; fall back to your own thinking.

That's it. You're ready. Re-read doc 00 once before the interview, then breathe.

Good luck.
