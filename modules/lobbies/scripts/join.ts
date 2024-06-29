import {
	CreatePlayersRequest,
	CreatePlayersResponse,
} from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";
import {
	Lobby,
	PlayerRequest,
	PlayerWithToken,
} from "../utils/types.ts";

export interface Request {
	lobbyId: string;
	players: PlayerRequest[];
}

export interface Response {
	lobby: Lobby;
	players: PlayerWithToken[];
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

	// Setup players
	const playerOpts: PlayerRequest[] = [];
	const playerTokens: Record<string, string> = {};
	for (const _player of req.players) {
		const playerId = crypto.randomUUID();
		const { token: playerToken } = await ctx.modules.tokens.create({
			type: "player",
			meta: { playerId: playerId },
		});
		playerOpts.push({ playerId });
		playerTokens[playerId] = playerToken.token;
	}

	const { lobby, players }: CreatePlayersResponse = await manager.call(
		"createPlayers",
		{
            lobbyId: req.lobbyId,
            players: playerOpts,
        } as CreatePlayersRequest,
	);

	return {
		lobby,
		players: players.map((x) => ({ token: playerTokens[x.id], ...x })),
	};
}
