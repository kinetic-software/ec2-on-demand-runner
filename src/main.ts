import * as core from '@actions/core';
import * as github from '@actions/github';

import { errorMessage } from './helpers';
import { getUserData, createRunnerInstance } from './ec2';
import { createJitConfig, getLatestRelease } from './github';

export async function run() {
  try {
    const runnerGroup = core.getInput('runner-group', { required: true });
    const securityGroups = core.getInput('security-groups', { required: true }).split(',');
    const subnet = core.getInput('subnet', { required: true });
    const githubToken = core.getInput('github-token', { required: true });
    const instanceType = core.getInput('instance-type', { required: false });

    const octokit = github.getOctokit(githubToken);

    const jitConfig = await createJitConfig(octokit, runnerGroup);

    const latestRelease = await getLatestRelease(octokit);
    if (!latestRelease.hash) {
      throw new Error('Unable to parse hash from @actions/runner release body');
    }

    const userData = getUserData(latestRelease.download_url, latestRelease.hash, jitConfig.token);
    await createRunnerInstance(instanceType, userData, jitConfig.name, subnet, securityGroups);
  } catch (e) {
    console.log(e);
    core.setFailed(errorMessage(e));
  }
}
