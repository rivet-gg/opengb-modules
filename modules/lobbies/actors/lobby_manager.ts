import { ActorBase, RuntimeError } from "../module.gen.ts";
import { Config } from "../config.ts";
import { Lobby, Player } from "../utils/types.ts";

const GC_INTERVAL = 1000;

type Input = undefined;

interface State {
	currentVersion: string;
	lobbies: Map<string, Lobby>;
	servers: Map<string, Server>;
}

interface Server {
	id: string;
	createdAt: number;
	createFinishedAt?: number;
}

interface CreateLobbyRequest extends BaseRequest {
  lobby: LobbyRequest,
  players: PlayerRequest[]
}

// TODO: Document why we make everythign sync in this actor and use background jobs

export class Actor extends ActorBase<Input, State> {
  initialize(_input: Input) {
    // Start GC loop
    this.gc();

		return {
			// TODO:
			currentVersion: "TODO",
			lobbies: new Map(),
			servers: new Map(),
		};

  }

	// MARK: Lobby
	public createLobby(req: CreateLobbyRequest): CreateLobbyResponse {
		// TODO: Insert lobby before call create server & handle error

		if (req.players.length > req.lobby.maxPlayers) {
			throw new RuntimeError("more_players_than_max")
		}

		if (
			req.lobby.destroyOnEmptyAfter != undefined &&
			(!req.players.length || req.players.length == 0)
		) {
			throw new RuntimeError("lobby_create_missing_players");
		}

		// Create lobby
		const serverId = crypto.randomUUID();
		const lobby: Lobby = {
			id: req.lobby.lobbyId,
			tags: req.lobby.tags,
			createdAt: Date.now(),
			emptyAt: Date.now(),
			players: new Map(),
			maxPlayers: req.lobby.maxPlayers,
            maxPlayersDirect: req.lobby.maxPlayersDirect,
			serverId,
			version: req.lobby.version,
		};
		this.state.lobbies.set(lobby.id, lobby);

		// Add server
		const server: Server = { id: serverId, createdAt: Date.now() };
		this.state.servers.set(server.id, server);

		// Create players
		const { players } = this.createPlayers({
      config, lobbyId: lobby.id,
      players: req.players,
    });

		// Run background job
		this.createLobbyBackground(lobby.id, server.id);

		return { lobby, players };
	}

	private async createLobbyBackground(lobbyId: string, serverId: string) {
		// TODO: Race condition with publishign & deleting lobby if delete request gets processed first

		// Create server
		await RIVET.servers.create({ serverId });

		// Update server state
		const server = this.state.servers.get(serverId);
		if (server) {
			server.createFinishedAt = Date.now();
		}
	}

	destroyLobby(opts: DestroyLobbyRequest) {
		// Remove lobby
		const lobby = this.state.lobbies.get(opts.lobbyId);
		this.state.lobbies.delete(opts.lobbyId);
		if (!lobby) {
			throw new RuntimeError("lobby_not_found", {
				meta: { lobbyId: opts.lobbyId },
			});
		}

		// TODO: Optimize
		// Get server
		const didDeleteServer = this.state.servers.delete(lobby.serverId);
		if (didDeleteServer) {
			// Run background job
			this.destroyLobbyBackground(lobby.serverId)
		} else {
			console.warn("Did not find server to delete", lobby.serverId);

		}
	}

	private async destroyLobbyBackground(serverId: string) {
		// Destroy server
		await RIVET.servers.destroy({ serverId });
	}

	findLobby(opts: FindLobbyRequest): FindLobbyResponse {
		const lobby = this.queryLobby(opts.query, opts.players.length);
		if (!lobby) {
			throw new RuntimeError("no_matching_lobbies", {
				meta: {
					playerCount: opts.players.length,
                    query: opts.query,
				}
			})
		}
		return this.createPlayers({ lobbyId: lobby.id, players: opts.players });
	}

	findOrCreateLobby(opts: FindOrCreateLobbyRequest): FindOrCreateLobbyResponse {
		const lobby = this.queryLobby(opts.query, opts.players.length);
		if (lobby) {
			return this.createPlayers({ lobbyId: lobby.id, players: opts.players });
		} else {
			return this.createLobby(opts.lobby, opts.players);
		}
	}

	setLobbyReady(opts: SetLobbyReadyRequest) {
		// Get lobby. Fail gracefully since there may be a race condition with deleting lobby.
		const lobby = this.state.lobbies.get(opts.lobbyId);
		if (!lobby) return;

		// Update ready state
		if (lobby.readyAt !== undefined) {
			throw new RuntimeError("lobby_already_ready");
		}

		lobby.readyAt = Date.now();

		// TODO: Call handlers
	}

	listLobbies(opts: ListLobbiesRequest): Lobby[] {
		return Array.from(this.state.lobbies.values());
	}

	createPlayers(opts: CreatePlayersRequest): CreatePlayersResponse {
		const lobby = this.getLobby(opts.lobbyId);

		if (opts.players.length == 0) {
			return { lobby, players: [] };
		}

		// Check for too many players for IP
		if (opts.config.players.maxPerIp != undefined) {
			// Count the number of IPs for the request
			const reqIpCounts = new Map<string, number>();
			for (const player of opts.players) {
				if (player.publicIp) {
					const count = reqIpCounts.get(player.publicIp) ?? 0;
					reqIpCounts.set(player.publicIp, count + 1);
				}
			}

			// Valdiate IPs
			for (const [ip, reqIpCount] of reqIpCounts) {
				const playersForIp = this.playersForIp(ip);

				// Calculate the number of players over the max player count,
				// including the player making the request.
				const ipOverflow = (playersForIp.length + reqIpCount) - opts.config.players.maxPerIp;

				// Handle too many players per IP
				if (ipOverflow > 0) {
					// Before throwing an error, we'll try removing players
					// that have not connected to a server yet. This helps
					// mitigate the edge case where the game has a bug causing
					// players to fail to connect, leaving a lot of unconnected
					// players in the matchmaker. In this situation, new
					// players can still be created.
					//
					// If there are unconnected players that can be removed,
					// those players will be removed and this will continue as
					// normal.

					// Find players that have not connected yet, sorted oldest
					// to newest. This does not include the player that is
					// making the request.
					const unconnectedPlayersForIp = playersForIp
						.filter(x => x.connectedAt == undefined)
						.sort((a, b) => a.createdAt - b.createdAt);

					// Check if there are enough players that we can delete to
					// make space for the new players
					if (unconnectedPlayersForIp.length >= ipOverflow) {
						console.warn("Removing unconnected player to make space for new player. The game server is likely having issues accepting connections.", {
							ip,
							ipOverflow,
							maxPerIp: opts.config.players.maxPerIp,
						});

						// Remove oldest players first in favor of the new
						// player we're about to add
						for (let i = 0; i < ipOverflow; i++) {
							const unconnectedPlayer = unconnectedPlayersForIp[i];
							this.destroyPlayers({ lobbyId: unconnectedPlayer.lobbyId, playerIds: [unconnectedPlayer.id] });
						}
					} else {
						// Fail
						throw new RuntimeError("too_many_players_for_ip", {
							meta: { ip }
						})
					}
				}
			}
		}

		// Check if we need to remove unconnected players
		if (opts.config.players.maxUnconnected != undefined) {
			const unconnectedPlayers = this.unconnectedPlayers();

			const unconnectedOverflow = (unconnectedPlayers.length + opts.players.length) - opts.config.players.maxUnconnected;
			if (unconnectedOverflow > 0) {
				// Calc number of players to remove
				const unconnectedPlayersToRemove = Math.min(unconnectedOverflow, unconnectedPlayers.length);
				console.warn("Removing unconnected player to make space for new player. The game server is likely having issues accepting connections.", {
				   maxUnconnected: opts.config.players.maxUnconnected,
				   unconnectedOverflow,
				   unconnectedPlayersToRemove
				})

				// Remove unconnected players from oldest to newest
				unconnectedPlayers.sort((a, b) => a.createdAt - b.createdAt);
				for (let i = 0; i < unconnectedPlayersToRemove; i++) {
					const player = unconnectedPlayers[i];
					this.destroyPlayers({
						lobbyId: player.lobbyId,
						playerIds: [player.id],
					})
				}
			}
		}

		// Check for available spots in lobby
		if (lobby.maxPlayers - opts.players.length < 0) {
			throw new RuntimeError("lobby_full", { meta: { lobbyId: opts.lobbyId }});
		}

		// Create players
		const players = [];
		for (const playerOpts of opts.players) {
			const player: Player = {
				id: playerOpts.playerId,
				lobbyId: lobby.id,
				createdAt: Date.now(),
				publicIp: playerOpts.publicIp,
			};
			lobby.players.set(player.id, player);
			players.push(player);
		}

		// Make lobby not empty
		lobby.emptyAt = undefined;

		return { lobby, players };
	}

	destroyPlayers(opts: DestroyPlayersRequest) {
		const lobby = this.getLobby(opts.lobbyId);

		// Remove player
		for (const playerId of opts.playerIds) {
			lobby.players.delete(playerId);
		}

		// Destroy lobby immediately on empty
		if (lobby.players.size == 0) {
			lobby.emptyAt = Date.now();

			if (lobby.destroyOnEmptyAfter == 0) {
				console.log("Destroying empty lobby", { lobbyId: lobby.id, unreadyExpireAfter: opts.config.lobbies.unreadyExpireAfter });
				this.destroyLobby({ lobbyId: lobby.id });
			}
		}
	}

	setPlayerConnected(opts: SetPlayersConnectedRequest) {
		const lobby = this.getLobby(opts.lobbyId);

		// Validate players
		const allPlayers = [];
		for (const playerId of opts.playerIds) {
			const player = lobby.players.get(playerId);
			if (player) {
				// TODO: Allow reusing connection token
				// TODO: What if the player already connected
				if (player.connectedAt != undefined) {
					throw new RuntimeError("player_already_connected", {
						meta: { lobbyId: lobby.id, playerId }
					})
				}

				allPlayers.push(player);
			} else {
				throw new RuntimeError("player_disconnected", {
					meta: { lobbyId: lobby.id, playerId }
				})
			}
		}

		// Update players
		for (const player of allPlayers) {
			player.connectedAt = Date.now();
		}
	}

	gc() {
    // Schedule next GC
    this.schedule.after(GC_INTERVAL, "gc", undefined);

		let unreadyLobbies = 0;
		let emptyLobbies = 0;
		let unconnectedPlayers = 0;
		let oldPlayers = 0;
		for (const lobby of Array.from(this.state.lobbies.values())) {
			// Destroy lobby if unready
			// TODO: pass this on lobby create instead of in config?
			if (lobby.readyAt == undefined && Date.now() - lobby.createdAt > opts.config.lobbies.unreadyExpireAfter) {
				console.warn("Destroying unready lobby", { lobbyId: lobby.id, unreadyExpireAfter: opts.config.lobbies.unreadyExpireAfter });
				this.destroyLobby({ lobbyId: lobby.id });
				unreadyLobbies++;
				continue;
			}

			// Destroy lobby if empty for long enough
			if (lobby.destroyOnEmptyAfter != undefined && lobby.emptyAt != undefined && Date.now() - lobby.emptyAt > lobby.destroyOnEmptyAfter) {
				console.log("Destroying empty lobby", { lobbyId: lobby.id, unreadyExpireAfter: opts.config.lobbies.unreadyExpireAfter });
				this.destroyLobby({ lobbyId: lobby.id });
				emptyLobbies++;
				continue;
			}

			if (lobby.readyAt != undefined) {
				for (const player of Array.from(lobby.players.values())) {
					// If joining a preemptively created lobby, the player's
					// created timestamp will be earlier than when the lobby
					// actually becomes able to be connected to.
					//
					// GC players based on the timestamp the lobby started if
					// needed.
					const startAt = Math.max(player.createdAt, lobby.readyAt);
					
					// Clean up unconnected players
					if (player.connectedAt == undefined && Date.now() - startAt > opts.config.players.unconnectedExpireAfter) {
						console.log("Destroying unconnected player", {
							playerId: player.id,
							unconnectedExpireAfter: opts.config.players.unconnectedExpireAfter,
						});
						this.destroyPlayers({
							lobbyId: player.lobbyId,
							playerIds: [player.id]
						});
						unconnectedPlayers++;
						continue;
					}

					// Clean up really old players
					if (opts.config.players.autoDestroyAfter != undefined && Date.now() - startAt > opts.config.players.autoDestroyAfter) {
						console.log("Destroying old player", {
							playerId: player.id,
							autoDestroyAfter: opts.config.players.autoDestroyAfter,
						});
						this.destroyPlayers({
							lobbyId: player.lobbyId,
							playerIds: [player.id]
						});
						oldPlayers++;
						continue;
					}
				}
			}
		}

		console.log("GC summary", { unreadyLobbies, emptyLobbies, unconnectedPlayers, oldPlayers });
	}

	/**
	 * Returns a lobby or throws `lobby_not_found`.
	 */
	private getLobby(lobbyId: string): Lobby {
		const lobby = this.state.lobbies.get(lobbyId);
		if (lobby === undefined) {
			throw new RuntimeError("lobby_not_found", {
				meta: { lobbyId },
			});
		}
		return lobby;
	}

	/**
	 * Finds a lobby for a given query.
	 */
	private queryLobby(query: QueryRequest, playerCount: number): Lobby | undefined {
		// TODO: optimize
		// Find largest lobby that can fit the requrested players
		const lobbies = Array.from(this.state.lobbies.values())
			.filter(x => x.version == query.version)
			.filter(x => x.players.size <= x.maxPlayers - playerCount)
			.filter(x => lobbyTagsMatch(query.tags, x.tags))
			.sort((a, b) => b.createdAt - a.createdAt)
			.sort((a, b) => b.players.size - a.players.size);
		return lobbies[0];
	}

	playersForIp(ip: string): Player[] {
		// TODO: optimize
		const players = [];
		for (const lobby of this.state.lobbies.values()) {
			for (const player of lobby.players.values()) {
				if (player.publicIp == ip) {
					players.push(player);
				}
			}
		}
		return players;
	}

	unconnectedPlayers(): Player[] {
		// TODO: optimize
		const players = [];
		for (const lobby of this.state.lobbies.values()) {
			// Don't count unready lobbies since these players haven't had time to connect yet
			if (lobby.readyAt == undefined) continue;

			for (const player of lobby.players.values()) {
				if (player.connectedAt == undefined) {
					players.push(player);
				}
			}
		}
		return players;
	}

}

interface CommonResponse {
  lobby: Lobby,
  players: Player[];
}

export interface BaseRequest {
    config: Config,
}

// MARK: Create Lobby
export interface CreateLobbyRequest extends BaseRequest {
	lobby: LobbyRequest,
	players: PlayerRequest[];
}

export type CreateLobbyResponse = CommonResponse;

// MARK: Destroy Lobby
export interface DestroyLobbyRequest extends BaseRequest {
	lobbyId: string;
}

// MARK: Find Lobby
export interface FindLobbyRequest extends BaseRequest {
	query: QueryRequest,
	players: PlayerRequest[];
}

export type FindLobbyResponse = CommonResponse;

// MARK: Find or Create
export interface FindOrCreateLobbyRequest extends BaseRequest {
	query: QueryRequest,
	lobby: LobbyRequest,
	players: PlayerRequest[];
}

export type FindOrCreateLobbyResponse = CommonResponse;

// MARK: Set Lobby Ready
export interface SetLobbyReadyRequest extends BaseRequest {
	lobbyId: string;
}

// MARK: List Lobbies
export interface ListLobbiesRequest extends BaseRequest {

}

// MARK: Create Players
export interface CreatePlayersRequest extends BaseRequest {
	lobbyId: string;
	players: PlayerRequest[],
}

export interface CreatePlayersResponse {
	lobby: Lobby,
	players: Player[],
}

// MARK: Destroy Players
export interface DestroyPlayersRequest extends BaseRequest {
	lobbyId: string;
	playerIds: string[];
}

// MARK: Set Players Connected
export interface SetPlayersConnectedRequest extends BaseRequest {
	lobbyId: string;
	playerIds: string[];
}

// MARK: Common
export interface QueryRequest {
	version: string;
	tags: Record<string, string>;
}

export interface LobbyRequest {
	lobbyId: string;
	version: string,
	tags: Record<string, string>,
	lobbyToken: string;
	maxPlayers: number;
    maxPlayersDirect: number;
	destroyOnEmptyAfter: number;
}

export interface PlayerRequest {
	playerId: string;
	publicIp?: string;
}


// MARK: Rivet
interface ServersCreateRequest {
	serverId?: string,
}

interface RivetDynamicServer {
	serverId: string;
}

// TODO: Use https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil for all API requests
const RIVET = {
	servers: {
		async create(opts: ServersCreateRequest): Promise<RivetDynamicServer> {
			await new Promise(resolve => setTimeout(resolve, 1000));
			return { serverId: crypto.randomUUID() };
		},
		async destroy(opts: { serverId: string }): Promise<void> {
			await new Promise(resolve => setTimeout(resolve, 1000));
		},
	},
};
