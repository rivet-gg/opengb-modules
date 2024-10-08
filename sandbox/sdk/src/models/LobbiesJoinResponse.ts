/* tslint:disable */
/* eslint-disable */
/**
 * Open Game Backend
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
import type { LobbiesCreateResponsePlayersInner } from './LobbiesCreateResponsePlayersInner';
import {
    LobbiesCreateResponsePlayersInnerFromJSON,
    LobbiesCreateResponsePlayersInnerFromJSONTyped,
    LobbiesCreateResponsePlayersInnerToJSON,
} from './LobbiesCreateResponsePlayersInner';
import type { LobbiesCreateResponseLobby } from './LobbiesCreateResponseLobby';
import {
    LobbiesCreateResponseLobbyFromJSON,
    LobbiesCreateResponseLobbyFromJSONTyped,
    LobbiesCreateResponseLobbyToJSON,
} from './LobbiesCreateResponseLobby';

/**
 * 
 * @export
 * @interface LobbiesJoinResponse
 */
export interface LobbiesJoinResponse {
    /**
     * 
     * @type {LobbiesCreateResponseLobby}
     * @memberof LobbiesJoinResponse
     */
    lobby: LobbiesCreateResponseLobby;
    /**
     * 
     * @type {Array<LobbiesCreateResponsePlayersInner>}
     * @memberof LobbiesJoinResponse
     */
    players: Array<LobbiesCreateResponsePlayersInner>;
}

/**
 * Check if a given object implements the LobbiesJoinResponse interface.
 */
export function instanceOfLobbiesJoinResponse(value: object): value is LobbiesJoinResponse {
    if (!('lobby' in value) || value['lobby'] === undefined) return false;
    if (!('players' in value) || value['players'] === undefined) return false;
    return true;
}

export function LobbiesJoinResponseFromJSON(json: any): LobbiesJoinResponse {
    return LobbiesJoinResponseFromJSONTyped(json, false);
}

export function LobbiesJoinResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): LobbiesJoinResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'lobby': LobbiesCreateResponseLobbyFromJSON(json['lobby']),
        'players': ((json['players'] as Array<any>).map(LobbiesCreateResponsePlayersInnerFromJSON)),
    };
}

export function LobbiesJoinResponseToJSON(value?: LobbiesJoinResponse | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'lobby': LobbiesCreateResponseLobbyToJSON(value['lobby']),
        'players': ((value['players'] as Array<any>).map(LobbiesCreateResponsePlayersInnerToJSON)),
    };
}

