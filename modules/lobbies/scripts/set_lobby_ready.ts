import { SetLobbyReadyRequest } from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";

export interface Request {
	lobbyToken: string;
}

export interface Response {
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	let manager;
	if (!await ctx.actors.lobbies.lobbyManager.exists("default")) {
		manager = await ctx.actors.lobbies.lobbyManager.create("default", {});
	} else {
		manager = ctx.actors.lobbies.lobbyManager.get("default");
	}

	const { token } = await ctx.modules.tokens.validate({
		token: req.lobbyToken,
	});
	const lobbyId: string = token.meta.lobbyId;

	await manager.call("setLobbyReady", { lobbyId } as SetLobbyReadyRequest);

	return {};
}
