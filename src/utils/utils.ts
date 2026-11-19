import { GITHUB_REPO } from '@/constants/cli';

export const getStarsCount = async (repo: string = GITHUB_REPO): Promise<number> => {
  const response = await fetch(`https://api.github.com/repos/${repo}`);
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  const data = await response.json();
  return data.stargazers_count || 0;
};

export const decodeLabel = (label: string): string => {
  if (!label) return '';
  return label
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const toPascal = (str: string) =>
  (str || '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
