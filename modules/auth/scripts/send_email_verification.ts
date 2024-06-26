import { RuntimeError } from "../module.gen.ts";
import { ScriptContext } from "../module.gen.ts";
import { Verification } from "../utils/types.ts";

export interface Request {
	email: string;
	userToken?: string;
}

export interface Response {
	verification: Verification;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({});

	if (!ctx.config.email) throw new RuntimeError("provider_disabled");

	// Check if the email is already associated with an identity
	const existingIdentity = await ctx.db.emailPasswordless.findFirst({
		where: { email: req.email },
	});

	// Fetch existing user if session token is provided
	let userId: string | undefined = existingIdentity?.userId;

	if (req.userToken) {
		const authRes = await ctx.modules.users.authenticateToken({
			userToken: req.userToken,
		});

		if (existingIdentity && existingIdentity.userId !== authRes.userId) {
			throw new RuntimeError("email_already_used");
		}

		userId = authRes.userId;
	}

	// Create verification
	const code = generateCode();
	const maxAttemptCount = 3;
	const expiration = 60 * 60 * 1000;
	const verification = await ctx.db.emailPasswordlessVerification.create({
		data: {
			userId,
			email: req.email,
			code,
			maxAttemptCount,
			expireAt: new Date(Date.now() + expiration),
		},
		select: { id: true },
	});

	// Send email
	await ctx.modules.email.sendEmail({
		from: {
			email: ctx.config.email.fromEmail ?? "hello@test.com",
			name: ctx.config.email.fromName ?? "Authentication Code",
		},
		to: [{ email: req.email }],
		subject: "Your verification code",
		text: `Your verification code is: ${code}`,
		html: `Your verification code is: <b>${code}</b>`,
	});

	return { verification };
}

function generateCode(): string {
	const length = 8;
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}
