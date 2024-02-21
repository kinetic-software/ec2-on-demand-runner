import { EC2Client, RunInstancesCommand, waitUntilInstanceRunning, _InstanceType } from '@aws-sdk/client-ec2';

export function getUserData(download_url: string, download_hash: string, encodedJitConfig: string) {
  /**
   * create root dir /runner
   * cd to /runner
   * ensure system up to date
   * download latest release of runner
   * check shasum of download
   * unzip runner
   * start the runner in background with jitconfig
   * wait for the backgrounded process to finish
   * shut down VM
   */
  const userData = `#!/bin/bash
mkdir /runner
cd /runner
apt update -y
apt install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
curl -o actions-runner-linux.tar.gz -L ${download_url}
echo "${download_hash}  actions-runner-linux.tar.gz" | shasum -a 256 -c
tar xzf ./actions-runner-linux.tar.gz
RUNNER_ALLOW_RUNASROOT=1 ./run.sh --jitconfig ${encodedJitConfig} > /tmp/runner.log 2>&1 &
wait $!
shutdown now -h
`;
  return btoa(userData);
}

export async function createRunnerInstance(
  instanceType: string,
  userData: string,
  name: string,
  subnet: string,
  securityGroups: string[]
) {
  if (!_InstanceType.hasOwnProperty(instanceType.replace('.', '_'))) {
    throw new Error(`Invalid instance type specified: ${instanceType}`);
  }

  const ec2Client = new EC2Client({ region: 'eu-west-1' });
  const runInstanceCommand = new RunInstancesCommand({
    ImageId: 'ami-0905a3c97561e0b69', //ubuntu //'ami-0ef9e689241f0bb6e', // amazon linux 2023
    InstanceType: instanceType as _InstanceType,
    MinCount: 1,
    MaxCount: 1,
    UserData: userData,
    InstanceInitiatedShutdownBehavior: 'terminate', // when the VM shuts down, it will terminate and destroy itself
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [{ Key: 'Name', Value: name }]
      }
    ],
    NetworkInterfaces: [
      {
        AssociatePublicIpAddress: true,
        DeviceIndex: 0,
        SubnetId: subnet,
        Groups: securityGroups
      }
    ]
  });

  const ec2Response = await ec2Client.send(runInstanceCommand);
  if (ec2Response.Instances) {
    const instanceId = ec2Response.Instances[0].InstanceId;
    if (!instanceId) {
      throw new Error('Failed to launch EC2 instance');
    }

    console.log(`Created EC2 instance id: ${instanceId} - ${name}, waiting until running...`);
    const wait = await waitUntilInstanceRunning(
      {
        client: ec2Client,
        maxWaitTime: 300 // 5 minutes
      },
      {
        InstanceIds: [instanceId]
      }
    );

    if (wait.state != 'SUCCESS') {
      throw new Error(`Failed to init EC2 instance: ${wait.state} - ${wait.reason}`);
    }
  }
}
