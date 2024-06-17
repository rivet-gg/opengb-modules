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
/**
 * 
 * @export
 * @interface LobbiesCreateResponseLobbyBackendServerPortsValueRouting
 */
export interface LobbiesCreateResponseLobbyBackendServerPortsValueRouting {
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValueRouting
     */
    gameGuard?: { [key: string]: any; };
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValueRouting
     */
    host?: { [key: string]: any; };
}

/**
 * Check if a given object implements the LobbiesCreateResponseLobbyBackendServerPortsValueRouting interface.
 */
export function instanceOfLobbiesCreateResponseLobbyBackendServerPortsValueRouting(value: object): value is LobbiesCreateResponseLobbyBackendServerPortsValueRouting {
    return true;
}

export function LobbiesCreateResponseLobbyBackendServerPortsValueRoutingFromJSON(json: any): LobbiesCreateResponseLobbyBackendServerPortsValueRouting {
    return LobbiesCreateResponseLobbyBackendServerPortsValueRoutingFromJSONTyped(json, false);
}

export function LobbiesCreateResponseLobbyBackendServerPortsValueRoutingFromJSONTyped(json: any, ignoreDiscriminator: boolean): LobbiesCreateResponseLobbyBackendServerPortsValueRouting {
    if (json == null) {
        return json;
    }
    return {
        
        'gameGuard': json['game_guard'] == null ? undefined : json['game_guard'],
        'host': json['host'] == null ? undefined : json['host'],
    };
}

export function LobbiesCreateResponseLobbyBackendServerPortsValueRoutingToJSON(value?: LobbiesCreateResponseLobbyBackendServerPortsValueRouting | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'game_guard': value['gameGuard'],
        'host': value['host'],
    };
}

