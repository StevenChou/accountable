# Improve the harness

Run this at Deploy, after the review fixes and before the merge.

1. Look at what went wrong on this change: the review's findings, what the person corrected and what the checks caught. For each Important finding, record the conditions that reproduce it and compare them with the cases in the original Proof.
2. For a mistake that has happened twice, add the correction to AGENTS.md or docs/REVIEW.md, or suggest a change to docs/STANDARDS.md for the person to make. If a tool can catch it, add it to the checks instead. When the review fix already added a regression test, verify that it exercises the conditions from step 1 and runs through the standard check command.
3. Remove anything out of date.
4. Improve this file, so that the next round makes a better change. Keep this as the last step.
