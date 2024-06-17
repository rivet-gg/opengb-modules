// This file is auto-generated by the Open Game Backend (https://opengb.dev) build system.
//
// Do not edit this file directly.
//
// Generated at 2024-08-15T23:48:59.095Z

import * as runtime from "../runtime";

import { RateLimit } from "./modules/rate_limit";

import { Tokens } from "./modules/tokens";

import { Lobbies } from "./modules/lobbies";

import { Rivet } from "./modules/rivet";

export class Backend extends runtime.BaseAPI {
	constructor(config: runtime.ConfigurationParameters) {
		super(new runtime.Configuration(config));
	}

	protected _rateLimit: RateLimit | undefined;

	public get rateLimit(): RateLimit {
		return this._rateLimit ??= new RateLimit(this.configuration);
	}

	protected _tokens: Tokens | undefined;

	public get tokens(): Tokens {
		return this._tokens ??= new Tokens(this.configuration);
	}

	protected _lobbies: Lobbies | undefined;

	public get lobbies(): Lobbies {
		return this._lobbies ??= new Lobbies(this.configuration);
	}

	protected _rivet: Rivet | undefined;

	public get rivet(): Rivet {
		return this._rivet ??= new Rivet(this.configuration);
	}
}
