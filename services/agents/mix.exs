defmodule Agents.MixProject do
  use Mix.Project

  def project do
    [
      app: :agents,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {Agents.Application, []}
    ]
  end

  defp deps do
    [
      {:jido, "~> 2.3"},
      {:jido_ai, "~> 2.3"},
      {:req_llm, "~> 1.24"}
    ]
  end
end
