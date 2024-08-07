import { RuntimeError, ScriptContext } from "../module.gen.ts";
import { FriendRequest, friendRequestFromRow } from "../utils/types.ts";

export interface Request {
	userToken: string;
	targetUserId: string;
}

export interface Response {
	friendRequest: FriendRequest;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	await ctx.modules.rateLimit.throttlePublic({});

	const { userId } = await ctx.modules.users.authenticateToken({
		userToken: req.userToken,
	});

	if (userId === req.targetUserId) {
		throw new RuntimeError("cannot_send_to_self");
	}

	// Sort the user IDs to ensure consistency
	const [userIdA, userIdB] = [userId, req.targetUserId].sort();

	const row = await ctx.db.$transaction(async (tx) => {
		// Validate that the users are not already friends
		// TODO: Remove this `any` and replace with a proper type
		const existingFriendRows = await tx.$queryRawUnsafe<any[]>(
			`
			SELECT 1
			FROM "${ctx.dbSchema}"."Friend"
			WHERE "userIdA" = $1 OR "userIdB" = $2
			FOR UPDATE
      `,
			userIdA,
			userIdB,
		);
		if (existingFriendRows.length > 0) {
			throw new RuntimeError("ALREADY_FRIENDS", { meta: { userIdA, userIdB } });
		}

		// Validate that the users do not already have a pending friend request
		const existingRequest = await tx.friendRequest.findFirst({
			where: {
				senderUserId: userId,
				targetUserId: req.targetUserId,
				acceptedAt: null,
				declinedAt: null,
			},
			select: { senderUserId: true, targetUserId: true },
		});
		if (existingRequest) {
			throw new RuntimeError("FRIEND_REQUEST_ALREADY_EXISTS", {
				meta: { userId, targetUserId: req.targetUserId },
			});
		}

		// Create friend request
		const friendRequest = await tx.friendRequest.create({
			data: {
				senderUserId: userId,
				targetUserId: req.targetUserId,
			},
		});

		return friendRequest;
	});

	return {
		friendRequest: friendRequestFromRow(row),
	};
}
