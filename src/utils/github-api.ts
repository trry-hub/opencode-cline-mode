/**
 * GitHub API utilities for fetching Cline prompts
 */

const CLINE_REPO = "cline/cline";
const CLINE_BRANCH = "main";
const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

export interface GitHubFile {
  name: string;
  path: string;
  content?: string;
  download_url: string | null;
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public rateLimitReset?: Date,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

/**
 * Fetch file content from GitHub raw URL
 */
export async function fetchFileFromGitHub(filePath: string): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${CLINE_REPO}/${CLINE_BRANCH}/${filePath}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new GitHubAPIError(
          `File not found: ${filePath}. The file may have been moved or renamed in the Cline repository.`,
          404,
        );
      }

      throw new GitHubAPIError(
        `Failed to fetch ${filePath}: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }

    throw new GitHubAPIError(
      `Network error while fetching ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Check GitHub API rate limit
 */
export async function checkRateLimit(): Promise<{
  remaining: number;
  resetTime: Date;
}> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/rate_limit`);

    if (!response.ok) {
      throw new GitHubAPIError(
        `Failed to check rate limit: ${response.status}`,
        response.status,
      );
    }

    const data = (await response.json()) as {
      rate: { remaining: number; reset: number };
    };

    return {
      remaining: data.rate.remaining,
      resetTime: new Date(data.rate.reset * 1000),
    };
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }

    throw new GitHubAPIError(
      `Network error while checking rate limit: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Fetch multiple files in parallel
 */
export async function fetchMultipleFiles(
  filePaths: string[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const errors: Array<{ path: string; error: Error }> = [];

  await Promise.all(
    filePaths.map(async (path) => {
      try {
        const content = await fetchFileFromGitHub(path);
        results.set(path, content);
      } catch (error) {
        errors.push({
          path,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }),
  );

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => `- ${e.path}: ${e.error.message}`)
      .join("\n");

    throw new GitHubAPIError(
      `Failed to fetch some files:\n${errorMessages}`,
      undefined,
      undefined,
    );
  }

  return results;
}
