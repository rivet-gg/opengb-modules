extends Node
class_name RivetMultiplayerManager

enum Transport { ENET, WEB_SOCKET }

# MARK: User Settings
var transport = Transport.ENET
var port_name = "game"

# MARK: Signals
## Client has successfully connected & authenticated to the server.
signal server_connected()

## Client has disconnected from the server.
signal server_disconnected()

## Client connected & authenticated to the server. Only called server-side.
signal client_connected(id: int)

## Client disconnected from the server. Only called server-side.
signal client_disconnected(id: int)

# MARK: State
## If running in server mode.
##
## Configured by adding `--server` flag to process.
var is_server: bool

## Peer connected to the server.
var peer: MultiplayerPeer

## Multiplayer case to SceneMultiplayer
var _scene_multiplayer: SceneMultiplayer:
	get:
		return multiplayer as SceneMultiplayer

## If the multiplayer server has started.
var _multiplayer_setup = false

## Hostname to run the server on.
##
## Overridden with SERVER_HOSTNAME environment variable.
##
## Server only
var _server_hostname: String = "127.0.0.1"

## Port to run the server on.
##
## Overridden with SERVER_PORT environment variable.
##
## Server only
var _server_port: int = 7777

## Token used to authenticate for this lobby.

##
## Server only
var _lobby_id: String = "00000000-0000-0000-0000-000000000000"

## Token used to authenticate for this lobby.
##
## Will be null for backends that do not support lobby tokens.
##
## Server only
var _lobby_token

## All player tokens for players that have authenticated.
##
## Server only
var _player_tokens = {}

## The player token for this client that will be sent on the next
## authentication.
##
## Client only
var _player_token = null

## Sets up the authentication hooks on SceneMultiplayer.
func setup_multiplayer():
	# Validate only initialized once
	if _multiplayer_setup:
		RivetLogger.warning("setup_multiplayer already called")
		return
	_multiplayer_setup = true

	is_server = OS.get_cmdline_user_args().has("--server")
	
	# Setup auth
	_scene_multiplayer.auth_callback = _auth_callback
	_scene_multiplayer.auth_timeout = 15.0

	# Setup signals
	_scene_multiplayer.peer_connected.connect(_on_peer_connected)
	_scene_multiplayer.peer_disconnected.connect(_on_peer_disconnected)
	_scene_multiplayer.connected_to_server.connect(_on_connected_to_server)
	_scene_multiplayer.connection_failed.connect(_on_connection_failed)
	_scene_multiplayer.server_disconnected.connect(_on_server_disconnected)
	_scene_multiplayer.peer_authenticating.connect(_on_peer_authenticating)
	_scene_multiplayer.peer_authentication_failed.connect(_on_peer_authentication_failed)

	# Start server immediately
	#
	# Client will be started when `connect_to_lobby` is called
	if is_server:
		if OS.has_environment("SERVER_HOSTNAME"):
			_server_hostname = OS.get_environment("SERVER_HOSTNAME")
		
		if OS.has_environment("SERVER_PORT"):
			_server_port = OS.get_environment("SERVER_PORT").to_int()
		
		if OS.has_environment("LOBBY_ID"):
			_lobby_id = OS.get_environment("LOBBY_ID")
		else:
			RivetLogger.warning("Missing lobby ID")
			
		if OS.has_environment("LOBBY_TOKEN"):
			_lobby_token = OS.get_environment("LOBBY_TOKEN")

		# Start server
		if transport == Transport.ENET:
			RivetLogger.log("Starting ENet server: %s:%s" % [_server_hostname, _server_port])
			
			peer = ENetMultiplayerPeer.new()
			peer.set_bind_ip(_server_hostname)
			peer.create_server(_server_port)
			# TODO:	crash if create server fails
			multiplayer.set_multiplayer_peer(peer)
		elif transport == Transport.WEB_SOCKET:
			RivetLogger.log("Starting WebSocket server: %s:%s" % [_server_hostname, _server_port])
			
			peer = WebSocketMultiplayerPeer.new()
			peer.create_server(_server_port, _server_hostname)
			# TODO:	crash if create server fails
			multiplayer.set_multiplayer_peer(peer)
		else:
			RivetLogger.error("Unsupported transport: %s" % transport)
			return

		# Notify lobby ready
		var request = {
			"lobbyId": _lobby_id,
		}
		if _lobby_token != null:
			request["lobbyToken"] = _lobby_token
		var response = await Rivet.lobbies.set_lobby_ready(request).async()
		if response.is_ok():
			RivetLogger.log("Lobby ready")
		else:
			RivetLogger.error("Lobby ready failed failed: %s" % response.body)

			# Crash the server so Rivet stops waiting for the server to start
			OS.crash("Lobby ready failed")

			return

## Connect to a lobby returned from the backend.
func connect_to_lobby(lobby, player):
	if !_multiplayer_setup:
		RivetLogger.error("setup_multiplayer needs to be called in _ready")
		return
	if is_server:
		RivetLogger.warning("Cannot called set_player_token on server")
		return
	
	RivetLogger.log("Connecting to lobby: %s %s" % [lobby, player])

	# Save token
	_player_token = player.token

	# Extract port from backend
	var hostname: String
	var port: int
	var is_tls: bool = false
	if "server" in lobby.backend:
		var backend_port = lobby.backend.server.ports[port_name]
		hostname = backend_port.publicHostname
		port = backend_port.publicPort
		if backend_port.protocol == "https" or backend_port.protocol == "tcp_tls":
			is_tls = true
	elif "localDevelopment" in lobby.backend:
		var backend_port = lobby.backend.localDevelopment.ports[port_name]
		hostname = backend_port.hostname
		port = backend_port.port
	else:
		RivetLogger.error("Unsupported lobby backend: %s" % lobby.backend)
		return

	# Start server
	if transport == Transport.ENET:
		RivetLogger.log("Connecting to ENet server: %s:%s" % [hostname, port])
		
		peer = ENetMultiplayerPeer.new()
		peer.create_client(hostname, port)
		multiplayer.set_multiplayer_peer(peer)
	elif transport == Transport.WEB_SOCKET:
		var ws_protocol: String
		if is_tls:
			ws_protocol = "wss"
		else:
			ws_protocol = "ws"
		var url = "%s://%s:%s" % [ws_protocol, hostname, port]
		
		RivetLogger.log("Connecting to WebSocket server: %s" % url)

		peer = WebSocketMultiplayerPeer.new()
		peer.create_client(url)
		multiplayer.set_multiplayer_peer(peer)
	else:
		RivetLogger.error("Unsupported transport: %s" % transport)

# MARK: Peers
func _on_peer_connected(id):
	RivetLogger.log('Peer connected: %s' % id)

	if is_server:
		client_connected.emit(id)
	else:
		server_connected.emit()

func _on_peer_disconnected(id):
	RivetLogger.log('Peer disconnected: %s' % id)

	if is_server:
		# Remove player from lobby
		var player_token = _player_tokens.get(id)
		if player_token != null:
			_player_tokens.erase(id)
			RivetLogger.log("Removing player %s" % player_token)

			var request = {
				"lobbyId": _lobby_id,
				"playerTokens": [player_token],
			}
			if _lobby_token != null:
				request["lobbyToken"] = _lobby_token
			var response = await Rivet.lobbies.set_player_disconnected(request).async()
			if response.is_error():
				RivetLogger.warning("Player disconnect failed for %id: %s" % [id, response.body])
		else:
			RivetLogger.warning("Player disconnected without player token: %s" % id)
			return

		# Signal
		client_disconnected.emit(id)
	else:
		server_disconnected.emit()

func _on_connected_to_server():
	RivetLogger.log('Connected to server')

func _on_connection_failed():
	RivetLogger.log('Connection failed')

func _on_server_disconnected():
	RivetLogger.log('Server disconnected')

# MARK: Authentication
func _auth_callback(id: int, buf: PackedByteArray):
	if is_server:
		# Read json
		var json = JSON.new()
		json.parse(buf.get_string_from_utf8())
		var data = json.get_data()

		RivetLogger.log("Player authenticating %s: %s" % [id, data])

		# Check token
		var player_token = data["player_token"]
		if player_token == null:
			RivetLogger.warning("Player token not provided in auth for %s" % id)
			_scene_multiplayer.disconnect_peer(id)
			return

		# Save player token in order to prevent race condition with
		# disconnecting before authentication complete
		_player_tokens[id] = data["player_token"]

		var request = {
			"lobbyId": _lobby_id,
			"playerTokens": [player_token]
		}
		if _lobby_token != null:
			request["lobbyToken"] = _lobby_token
		var response = await Rivet.lobbies.set_player_connected(request).async()
		if response.is_ok():
			RivetLogger.log("Player authenticated for %s" % id)
			_scene_multiplayer.complete_auth(id)
		else:
			# Player will be cleaned up on disconnect handler
			RivetLogger.warning("Player authentiation failed for %s: %s" % [id, response.body])
			_scene_multiplayer.disconnect_peer(id)
	else:
		# Server does not need to auth with client
		_scene_multiplayer.complete_auth(id)

func _on_peer_authenticating(id):
	#if is_server:
		#return

	RivetLogger.log("Authenticating with server")
	var body = JSON.stringify({ "player_token": _player_token })
	(multiplayer as SceneMultiplayer).send_auth(id, body.to_utf8_buffer())


func _on_peer_authentication_failed(id):
	#if !is_server:
		#return

	RivetLogger.warning("Client authentication failed %s" % id)
	multiplayer.set_multiplayer_peer(null)

