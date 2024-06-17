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
 * @interface LobbiesFindOrCreateResponse
 */
export interface LobbiesFindOrCreateResponse {
    /**
     * 
     * @type {LobbiesCreateResponseLobby}
     * @memberof LobbiesFindOrCreateResponse
     */
    lobby: LobbiesCreateResponseLobby;
    /**
     * 
     * @type {Array<LobbiesCreateResponsePlayersInner>}
     * @memberof LobbiesFindOrCreateResponse
     */
    players: Array<LobbiesCreateResponsePlayersInner>;
}

/**
 * Check if a given object implements the LobbiesFindOrCreateResponse interface.
 */
export function instanceOfLobbiesFindOrCreateResponse(value: object): value is LobbiesFindOrCreateResponse {
    if (!('lobby' in value) || value['lobby'] === undefined) return false;
    if (!('players' in value) || value['players'] === undefined) return false;
    return true;
}

export function LobbiesFindOrCreateResponseFromJSON(json: any): LobbiesFindOrCreateResponse {
    return LobbiesFindOrCreateResponseFromJSONTyped(json, false);
}

export function LobbiesFindOrCreateResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): LobbiesFindOrCreateResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'lobby': LobbiesCreateResponseLobbyFromJSON(json['lobby']),
        'players': ((json['players'] as Array<any>).map(LobbiesCreateResponsePlayersInnerFromJSON)),
    };
}

export function LobbiesFindOrCreateResponseToJSON(value?: LobbiesFindOrCreateResponse | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'lobby': LobbiesCreateResponseLobbyToJSON(value['lobby']),
        'players': ((value['players'] as Array<any>).map(LobbiesCreateResponsePlayersInnerToJSON)),
    };
}

