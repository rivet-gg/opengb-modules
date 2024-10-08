import {
	ListLobbiesRequest,
	ListLobbiesResponse,
} from "../utils/lobby_manager/rpc.ts";
import { ScriptContext } from "../module.gen.ts";

export interface Request {
	version: string;
  regions?: string[];
	tags?: Record<string, string>;
}

export interface Response {
	// TODO: Populate this
	lobbies: LobbyListEntry[];
}

interface LobbyListEntry {
	id: string;
  version: string;
  tags: Record<string, string>;
  createdAt: string;
  players: number;
  maxPlayers: number;
  maxPlayersDirect: number;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	// TODO: Cache this without hitting the DO

	const { lobbies } = await ctx.actors.lobbyManager.getOrCreateAndCall<
		undefined,
		ListLobbiesRequest,
		ListLobbiesResponse
	>(
		"default",
		undefined,
		"rpcListLobbies",
		{
      version: req.version,
      regions: req.regions,
      tags: req.tags,
    },
	);

	const lobbyList = lobbies.map((lobby) => ({
    id: lobby.id,
    version: lobby.version,
    tags: lobby.tags,
    createdAt: new Date(lobby.createdAt).toISOString(),
    players: lobby.players,
    maxPlayers: lobby.maxPlayers,
    maxPlayersDirect: lobby.maxPlayersDirect,
  } satisfies LobbyListEntry));

	return { lobbies: lobbyList };
}
