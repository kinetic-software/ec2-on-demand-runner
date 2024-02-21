# On-Demand GitHub Actions Self-Hosted Runner

This action creates an EC2 instance, provisions a github actions [JIT runner](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-just-in-time-runners), runs a single pipeline, then terminates the instance

## Inputs

### `runner-group`

**Required** The name of the runner group(label) to assign this runner to (e.g. qa-pool)

### `github-token`

**Required** GitHub PAT with permission to generate-jitconfig

### `security-groups`

**Required** Security groups to assign to the EC2 instance

### `subnet`

**Required** Subnet to place the instance in

### `instance-type`

**Optional(default: "t3.x3large")** Size of the EC2 instance

## Example usage

```yaml
uses: kinetic-software/kx.operations.custom-runner-action@v1
with:
  runner-group: qa-pool
  github-token: ${{ secrets.GH_PAT }}
  subnet: "subnet-ab1fdeee"
  security-groups: "sg-985f4e4cc1,sg-06a7fd8a6a"
```