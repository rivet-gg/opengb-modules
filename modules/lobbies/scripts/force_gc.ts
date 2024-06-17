import { ScriptContext } from "../module.gen.ts";

export interface Request {
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

	await manager.call("gc");

	return {};
}
