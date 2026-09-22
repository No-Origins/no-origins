# Agents

The No Origins agents harness. A Mix application on [Jido](https://jido.run), OTP app `:agents`.

It sits outside the pnpm workspace. The Next apps do not import it. A screen for the harness, when one exists, is a block on the grid that talks to this process.

Elixir 1.18+ and OTP 27+.

## Run

From the repo root:

```shell
cd services/agents
mix deps.get
mix test
iex -S mix
```

`Agents.Jido` starts with the application.

## Provider key

AI calls need a provider key. The install check does not.

```shell
cp .env.example .env
set -a && source .env && set +a
```

`config/runtime.exs` copies `OPENAI_API_KEY` into `:req_llm` at boot. ReqLLM also reads that variable, and a `.env` file, on its own.
