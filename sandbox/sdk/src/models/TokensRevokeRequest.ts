// This file is auto-generated by the Open Game Backend (https://opengb.dev) build system.
//
// Do not edit this file directly.
//
// Generated at 2024-08-15T23:48:58.811Z

/* tslint:disable */
/* eslint-disable */

/**
 * @export
 * @interface TokensRevokeRequest
 */
export interface TokensRevokeRequest {}

/**
 * Check if a given object implements the TokensRevokeRequest interface.
 */
export function instanceOfTokensRevokeRequest(
	_value: object,
): _value is TokensRevokeRequest {
	return true;
}

export function TokensRevokeRequestFromJSON(json: any): TokensRevokeRequest {
	return TokensRevokeRequestFromJSONTyped(json, false);
}

export function TokensRevokeRequestFromJSONTyped(
	json: any,
	ignoreDiscriminator: boolean,
): TokensRevokeRequest {
	if (json == null) {
		return json;
	}
	return {};
}

export function TokensRevokeRequestToJSON(
	value?: TokensRevokeRequest | null,
): any {
	if (value == null) {
		return value;
	}
	return {};
}
