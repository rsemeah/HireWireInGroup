export type GitHubProfile = {
  username: string
  name: string | null
  bio: string | null
  company: string | null
  location: string | null
  blog: string | null
  public_repos: number
  followers: number
  profile_url: string
}

export type GitHubRepo = {
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  updated_at: string
  fork: boolean
  archived: boolean
}

export function extractGithubUsername(url: string): string | null {
  try {
    const u = new URL(url)
    if (!/github\.com$/i.test(u.hostname)) return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length === 0) return null
    const username = parts[0]
    if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(username)) return null
    return username
  } catch {
    return null
  }
}

export async function fetchGithubProfile(username: string): Promise<{
  profile: GitHubProfile
  repos: GitHubRepo[]
}> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hirewire-parser',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers, cache: 'no-store' }),
    fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`,
      { headers, cache: 'no-store' }
    ),
  ])

  if (profileRes.status === 404) throw new Error(`GitHub user not found: ${username}`)
  if (profileRes.status === 403) throw new Error('GitHub API rate limit hit')
  if (!profileRes.ok) throw new Error(`GitHub profile fetch failed: ${profileRes.status}`)
  if (!reposRes.ok) throw new Error(`GitHub repos fetch failed: ${reposRes.status}`)

  const p = await profileRes.json()
  const r = (await reposRes.json()) as GitHubRepo[]

  const profile: GitHubProfile = {
    username: p.login,
    name: p.name ?? null,
    bio: p.bio ?? null,
    company: p.company ?? null,
    location: p.location ?? null,
    blog: p.blog ?? null,
    public_repos: p.public_repos ?? 0,
    followers: p.followers ?? 0,
    profile_url: p.html_url ?? `https://github.com/${username}`,
  }

  const repos = r
    .filter(repo => !repo.fork && !repo.archived)
    .slice(0, 10)

  return { profile, repos }
}

function compact(lines: (string | null)[]): string[] {
  return lines.filter((l): l is string => l !== null)
}

export function buildProfileEvidenceContent(p: GitHubProfile): string {
  return compact([
    `GitHub profile: @${p.username}`,
    p.name ? `Name: ${p.name}` : null,
    p.bio ? `Bio: ${p.bio}` : null,
    p.company ? `Company: ${p.company}` : null,
    p.location ? `Location: ${p.location}` : null,
    p.blog ? `Website: ${p.blog}` : null,
    `Public repos: ${p.public_repos}`,
    `Followers: ${p.followers}`,
  ]).join('\n')
}

export function buildRepoEvidenceContent(r: GitHubRepo): string {
  return compact([
    `Repository: ${r.name}`,
    r.description ? `Description: ${r.description}` : null,
    r.language ? `Primary language: ${r.language}` : null,
    r.topics.length ? `Topics: ${r.topics.join(', ')}` : null,
    `Stars: ${r.stargazers_count}`,
    `Forks: ${r.forks_count}`,
    `Last updated: ${new Date(r.updated_at).toISOString().slice(0, 10)}`,
    `URL: ${r.html_url}`,
  ]).join('\n')
}
