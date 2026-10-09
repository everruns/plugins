---
name: everruns-framework
description: Write Rust code that runs agents itself, with the `everruns` crate (agents, tools and durable sessions inside your own program) or `everruns-serve` (a hosted agent app with routes, tools and approvals). Use when the user embeds an agent in a Rust program or builds a serve app. To call a hosted Everruns agent from an app in any language, use everruns-sdk instead.
---

# Build with the Everruns Framework

Pick the piece that matches what the user is building:

| They are building | Use | Install |
|---|---|---|
| A Rust program that runs agents itself | `everruns` crate (the Framework) | `cargo add everruns --features openai` and `cargo add tokio --features macros,rt-multi-thread` |
| A hosted agent app with routes, tools and approvals (experimental) | `everruns-serve` | `cargo add everruns-serve tokio --features tokio/full` and `cargo add --build everruns-serve-build` |

An app that only calls agents hosted on Everruns needs the SDK, not the
Framework: see `everruns-sdk`.

## Framework in one example

```rust
use everruns::{Agent, Engine, OpenAI};

#[everruns::tool]
/// Look up the current stock level for a SKU.
async fn stock_level(sku: String) -> Result<u32, String> {
    Ok(42)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let agent = Agent::builder()
        .instructions("Answer inventory questions. Use the tool rather than guessing.")
        .provider(OpenAI::from_env()?)
        .model("gpt-5.6-terra")
        .tool(stock_level())
        .build()?;

    let session = Engine::new().create(agent);
    let turn = session.send_and_wait("How many SKU-1 do we have?").await?;
    println!("{}", turn.response);
    Ok(())
}
```

- The provider supplies the driver and key (`OpenAI::from_env` reads
  `OPENAI_API_KEY`); `.model("…")` only names the model. Other providers are
  their own crates or features.
- `send_and_wait` is the simple path; use `send` to stream events or steer a
  running turn.
- `#[everruns::tool]` derives the tool's JSON schema from the signature and doc
  comment.
- The same agent can be loaded from an `agent.toml` folder (see
  `everruns-agents-as-files`).

## Where to read next

Fetch only the set you need:

- Framework: <https://docs.everruns.com/_llms-txt/framework.txt>
  (quickstart, agents, sessions, tools, serve, testing with the simulator)
- Crate API docs: <https://docs.rs/everruns>
- Examples: <https://github.com/everruns/everruns/tree/main/examples>

## Habits that save time

- Check the crate version the project already uses (`Cargo.toml`) and read
  docs for that version; the Framework is pre-1.0 and changes between minor
  releases.
- Test agents offline with the built-in model simulator before spending
  provider credits; the Framework testing guide shows how.
- When code only needs to call a deployed agent, use the SDK
  (`everruns-sdk`), not the Framework.
