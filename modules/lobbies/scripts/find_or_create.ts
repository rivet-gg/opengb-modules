import {
	FindOrCreateLobbyRequest,
	FindOrCreateLobbyResponse,
} from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";
import { Lobby, PlayerRequest, PlayerWithToken } from "../utils/types.ts";

export interface Request {
    version: string,
	tags: Record<string, string>;
	players: PlayerRequest[];

    createConfig: {
        tags: Record<string, string>;
        maxPlayers: number;
        destroyOnEmptyAfter: number;
    }
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

	// Setup lobby
	const lobbyId = crypto.randomUUID();
	const { token: lobbyToken } = await ctx.modules.tokens.create({
		type: "lobby",
		meta: { lobbyId: lobbyId },
	});

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

	const { lobby, players }: FindOrCreateLobbyResponse = await manager.call(
		"findOrCreateLobby",
		{
            query: {
                version: req.version,
                tags: req.tags,
            },
            lobby: {
                lobbyId,
                version: req.version,
                tags: req.createConfig.tags,
                lobbyToken: lobbyToken.token,
                maxPlayers: req.createConfig.maxPlayers,
                destroyOnEmptyAfter: req.createConfig.destroyOnEmptyAfter,
            },
            players: playerOpts,
		} as FindOrCreateLobbyRequest,
	);

	return {
		lobby,
		players: players.map((x) => ({ token: playerTokens[x.id], ...x })),
	};
}
