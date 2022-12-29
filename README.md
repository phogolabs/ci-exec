# ci-exec

Execute a command and store its output

## Inputs

### `run`

**Required** The command to run.

### `shell`

The shell used to run command.

## Outputs

### `stdout`

The output of the command written to stdout.

### `stderr`

The output of the command written to stderr.

## Example usage

```yaml
steps:
- id: command
  uses: phogolabs/ci-exec@main
  continue-on-error: true
  with:
    run: cat unknown.txt

- run: Command Success
  run: echo ${{ steps.cmd.outputs.stdout }}

- run: Command Failure
  run: echo ${{ steps.cmd.outputs.stderr }}
```
