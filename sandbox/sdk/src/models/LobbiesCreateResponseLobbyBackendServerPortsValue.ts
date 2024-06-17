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
import type { LobbiesCreateResponseLobbyBackendServerPortsValueRouting } from './LobbiesCreateResponseLobbyBackendServerPortsValueRouting';
import {
    LobbiesCreateResponseLobbyBackendServerPortsValueRoutingFromJSON,
    LobbiesCreateResponseLobbyBackendServerPortsValueRoutingFromJSONTyped,
    LobbiesCreateResponseLobbyBackendServerPortsValueRoutingToJSON,
} from './LobbiesCreateResponseLobbyBackendServerPortsValueRouting';

/**
 * 
 * @export
 * @interface LobbiesCreateResponseLobbyBackendServerPortsValue
 */
export interface LobbiesCreateResponseLobbyBackendServerPortsValue {
    /**
     * 
     * @type {string}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValue
     */
    protocol: LobbiesCreateResponseLobbyBackendServerPortsValueProtocolEnum;
    /**
     * 
     * @type {number}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValue
     */
    internalPort?: number;
    /**
     * 
     * @type {string}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValue
     */
    publicHostname?: string;
    /**
     * 
     * @type {number}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValue
     */
    publicPort?: number;
    /**
     * 
     * @type {LobbiesCreateResponseLobbyBackendServerPortsValueRouting}
     * @memberof LobbiesCreateResponseLobbyBackendServerPortsValue
     */
    routing: LobbiesCreateResponseLobbyBackendServerPortsValueRouting;
}


/**
 * @export
 */
export const LobbiesCreateResponseLobbyBackendServerPortsValueProtocolEnum = {
    Http: 'http',
    Tcp: 'tcp',
    Udp: 'udp',
    Https: 'https',
    TcpTls: 'tcp_tls'
} as const;
export type LobbiesCreateResponseLobbyBackendServerPortsValueProtocolEnum = typeof LobbiesCreateResponseLobbyBackendServerPortsValueProtocolEnum[keyof typeof LobbiesCreateResponseLobbyBackendServerPortsValueProtocolEnum];


/**
 * Check if a given object implements the LobbiesCreateResponseLobbyBackendServerPortsValue interface.
 */
export function instanceOfLobbiesCreateResponseLobbyBackendServerPortsValue(value: object): value is LobbiesCreateResponseLobbyBackendServerPortsValue {
    if (!('protocol' in value) || value['protocol'] === undefined) return false;
    if (!('routing' in value) || value['routing'] === undefined) return false;
    return true;
}

export function LobbiesCreateResponseLobbyBackendServerPortsValueFromJSON(json: any): LobbiesCreateResponseLobbyBackendServerPortsValue {
    return LobbiesCreateResponseLobbyBackendServerPortsValueFromJSONTyped(json, false);
}

export function LobbiesCreateResponseLobbyBackendServerPortsValueFromJSONTyped(json: any, ignoreDiscriminator: boolean): LobbiesCreateResponseLobbyBackendServerPortsValue {
    if (json == null) {
        return json;
    }
    return {
        
        'protocol': json['protocol'],
        'internalPort': json['internalPort'] == null ? undefined : json['internalPort'],
        'publicHostname': json['publicHostname'] == null ? undefined : json['publicHostname'],
        'publicPort': json['publicPort'] == null ? undefined : json['publicPort'],
        'routing': LobbiesCreateResponseLobbyBackendServerPortsValueRoutingFromJSON(json['routing']),
    };
}

export function LobbiesCreateResponseLobbyBackendServerPortsValueToJSON(value?: LobbiesCreateResponseLobbyBackendServerPortsValue | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'protocol': value['protocol'],
        'internalPort': value['internalPort'],
        'publicHostname': value['publicHostname'],
        'publicPort': value['publicPort'],
        'routing': LobbiesCreateResponseLobbyBackendServerPortsValueRoutingToJSON(value['routing']),
    };
}

