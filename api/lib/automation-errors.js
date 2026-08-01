export class AutomationError extends Error {
  constructor(code, message, status = 400, retryable = false) {
    super(message);
    this.name = "AutomationError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function sendAutomationError(res, error) {
  if (error instanceof AutomationError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      retryable: error.retryable,
    });
  }
  if (error?.name === "ZodError") {
    return res.status(422).json({
      error: "The ScriptAI automation payload is invalid.",
      code: "INVALID_REQUEST",
      issues: error.issues?.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  console.error("ScriptAI automation request failed.");
  return res.status(500).json({
    error: "The ScriptAI automation request could not be completed.",
    code: "INTERNAL_ERROR",
  });
}

export function requireAutomationFeature() {
  if (process.env.CREATOR_PLANNING_AUTOMATION_ENABLED !== "true") {
    throw new AutomationError(
      "FEATURE_DISABLED",
      "Creator-planning automation is disabled.",
      503,
    );
  }
}
