import { ListLobbiesRequest } from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";
import { Lobby } from "../utils/types.ts";

export interface Request {
}

export interface Response {
	lobbies: Lobby[];
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	// TODO: Cache this without hitting the DO

	let manager;
	if (!await ctx.actors.lobbies.lobbyManager.exists("default")) {
		manager = await ctx.actors.lobbies.lobbyManager.create("default", {});
	} else {
		manager = ctx.actors.lobbies.lobbyManager.get("default");
	}

	const lobbies = await manager.call("listLobbies", {} as ListLobbiesRequest);

	return { lobbies };
}
