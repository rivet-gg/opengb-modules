// This file is auto-generated by the Open Game Backend (https://opengb.dev) build system.
//
// Do not edit this file directly.
//
// Generated at 2024-08-15T23:48:58.826Z

/* tslint:disable */
/* eslint-disable */

/**
 * @export
 * @interface TokensRevokeResponse
 */
export interface TokensRevokeResponse {}

/**
 * Check if a given object implements the TokensRevokeResponse interface.
 */
export function instanceOfTokensRevokeResponse(
	_value: object,
): _value is TokensRevokeResponse {
	return true;
}

export function TokensRevokeResponseFromJSON(json: any): TokensRevokeResponse {
	return TokensRevokeResponseFromJSONTyped(json, false);
}

export function TokensRevokeResponseFromJSONTyped(
	json: any,
	ignoreDiscriminator: boolean,
): TokensRevokeResponse {
	if (json == null) {
		return json;
	}
	return {};
}

export function TokensRevokeResponseToJSON(
	value?: TokensRevokeResponse | null,
): any {
	if (value == null) {
		return value;
	}
	return {};
}
