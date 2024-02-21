import { rnd, readHashFromBody } from './helpers';
import { Octokit } from '@octokit/core';
import * as github from '@actions/github';

export async function getLatestRelease(octokit: Octokit) {
  const latestRelease = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
    owner: 'actions',
    repo: 'runner'
  });

  if (latestRelease.status != 200) {
    throw new Error(`Failed to find latest release of actions/runner: ${latestRelease.data}`);
  }

  const runnerAsset = latestRelease.data.assets.find(a => a.name.startsWith('actions-runner-linux-x64'));
  if (!runnerAsset) {
    throw new Error('Failed to find correct runner asset from actions/runner repo');
  }
  const hash = readHashFromBody(latestRelease.data.body);
  return { hash, download_url: runnerAsset.browser_download_url };
}

export async function createJitConfig(octokit: Octokit, runnerGroup: string) {
  const name = `${runnerGroup}-${rnd()}`;

  const jitConfig = await octokit.request('POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig', {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    labels: ['self-hosted', runnerGroup],
    name: name,
    work_folder: '_work',
    runner_group_id: 1
  });

  return {
    token: jitConfig.data.encoded_jit_config,
    name: name
  };
}
