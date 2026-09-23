import Config

# Read at boot so the key never lands in a compiled artifact.
# Set only when present: a nil value would override ReqLLM's .env loading.
if api_key = System.get_env("OPENAI_API_KEY") do
  config :req_llm, openai_api_key: api_key
end
