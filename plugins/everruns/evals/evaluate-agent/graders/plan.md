---
type: llm
---
The reply sets up (or gives the exact steps to set up) an Everruns eval for the triage agent: cases drawn from real triage sessions or realistic issues, scorers that check the labeling behavior (for example that `github_add_labels` is called, or the expected labels appear), and a baseline run to compare against after the instructions change. Generic testing advice that does not use Everruns evals fails.
