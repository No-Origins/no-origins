defmodule Agents.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      Agents.Jido
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: Agents.Supervisor)
  end
end
