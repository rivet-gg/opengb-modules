import {
	CreateLobbyRequest,
	CreateLobbyResponse,
} from "../actors/lobby_manager.ts";
import { ScriptContext } from "../module.gen.ts";
import {
	Lobby,
	Player,
	PlayerRequest,
	PlayerWithToken,
} from "../utils/types.ts";

export interface Request {
    version: string;
	tags: Record<string, string>;
	maxPlayers: number;
    destroyOnEmptyAfter: number;

	players: PlayerRequest[];
}

export interface Response {
	lobby: Lobby;
	players: PlayerWithToken[];
}

// TODO: Doc why we create tokens on the script and not the DO

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
	//
	// This token will be disposed if the lobby is not created
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
			meta: { lobbyId: lobbyId, playerId: playerId },
		});
		playerOpts.push({ playerId });
		playerTokens[playerId] = playerToken.token;
	}

	const { lobby, players }: CreateLobbyResponse = await manager.call(
		"createLobby",
		{
			lobby: {
                lobbyId,
                version: req.version,
                tags: req.tags,
                lobbyToken: lobbyToken.token,
                maxPlayers: req.maxPlayers,
                destroyOnEmptyAfter: req.destroyOnEmptyAfter,
			},
            players: playerOpts,
		} as CreateLobbyRequest,
	);

	return {
		lobby,
		players: players.map((x) => ({ token: playerTokens[x.id], ...x })),
	};
}
