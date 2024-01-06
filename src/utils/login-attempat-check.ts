import { addSeconds, isAfter } from "date-fns";
import { UserLoginBody } from "../DTOs/user.dto";
import { UserAttempts } from "../controllers/user.controller";

/**
 * Should return true or false
 * If true then lock user
 * If false the don't lock the user
 */
export const loginAttempt = (
  user: UserLoginBody,
  userAttempts: UserAttempts
): boolean => {
  const attempts = userAttempts[user.username]?.attempts ?? -1;

  if (attempts === -1) {
    userAttempts[user.username] = {
      username: user.username,
      attempts: 1,
    };

    return false;
  }

  if (attempts < 2) {
    userAttempts[user.username] = {
      username: user.username,
      attempts: attempts + 1,
    };
    return false;
  }
  userAttempts[user.username] = {
    username: user.username,
    attempts: 0,
    lockedAt: Date.now(),
  };
  return true;
};

// Checks if user is locked or not
export const checkIfUserIsLockedToLogin = (
  user: UserLoginBody,
  userAttempts: UserAttempts
): boolean => {
  const userAttempt = userAttempts[user.username];
  const attempts = userAttempt?.attempts ?? -1;
  console.log("User attempts", JSON.stringify(userAttempt, null, 2));

  if (attempts === -1) {
    return false;
  }

  if (!userAttempt?.lockedAt) {
    return false;
  }

  // check if locked duration is more than 5 seconds
  const now = Date.now();
  const fiveMinutesFromLocked = addSeconds(new Date(userAttempt.lockedAt), 5);
  return !isAfter(now, fiveMinutesFromLocked);
};
