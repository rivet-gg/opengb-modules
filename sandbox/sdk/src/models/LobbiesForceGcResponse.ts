// This file is auto-generated by the Open Game Backend (https://opengb.dev) build system.
//
// Do not edit this file directly.
//
// Generated at 2024-08-15T23:48:58.958Z

/* tslint:disable */
/* eslint-disable */

/**
 * @export
 * @interface LobbiesForceGcResponse
 */
export interface LobbiesForceGcResponse {}

/**
 * Check if a given object implements the LobbiesForceGcResponse interface.
 */
export function instanceOfLobbiesForceGcResponse(
	_value: object,
): _value is LobbiesForceGcResponse {
	return true;
}

export function LobbiesForceGcResponseFromJSON(
	json: any,
): LobbiesForceGcResponse {
	return LobbiesForceGcResponseFromJSONTyped(json, false);
}

export function LobbiesForceGcResponseFromJSONTyped(
	json: any,
	ignoreDiscriminator: boolean,
): LobbiesForceGcResponse {
	if (json == null) {
		return json;
	}
	return {};
}

export function LobbiesForceGcResponseToJSON(
	value?: LobbiesForceGcResponse | null,
): any {
	if (value == null) {
		return value;
	}
	return {};
}