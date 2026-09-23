defmodule Agents.Install.SmokeAgent do
  use Jido.Agent,
    name: "smoke_agent",
    schema:
      Zoi.object(%{
        status: Zoi.string() |> Zoi.default("pending")
      })
end

defmodule Agents.Install.MarkReady do
  use Jido.Action,
    name: "mark_ready",
    schema: Zoi.object(%{})

  @impl true
  def run(_params, _context), do: {:ok, %{status: "ready"}}
end

defmodule Agents.InstallTest do
  use ExUnit.Case, async: false

  test "jido and jido_ai start" do
    assert {:ok, _} = Application.ensure_all_started(:jido)
    assert {:ok, _} = Application.ensure_all_started(:jido_ai)
  end

  test "a command moves the smoke agent to ready" do
    agent = Agents.Install.SmokeAgent.new()
    assert agent.state.status == "pending"

    {updated, _directives} =
      Agents.Install.SmokeAgent.cmd(agent, {Agents.Install.MarkReady, %{}})

    assert updated.state.status == "ready"
  end

  test "the jido supervisor is running" do
    assert is_pid(Process.whereis(Agents.Jido))
  end
end
