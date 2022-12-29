const core = require('@actions/core');
const process = require('process');
const { Buffer } = require('buffer');
const { Transform } = require('stream');
const { spawn } = require('child_process');


const options = {
  bash: ['--noprofile', '--norc', '-eo', 'pipefail', '-c'],
  sh: ['-e', '-c'],
  python: ['-c'],
  pwsh: ['-command', '.'],
  powershell: ['-command', '.']
}

const options_keys = `${Object.keys(options).join(', ')}`;

class RecordStream extends Transform {
  constructor () {
    super()
    this._data = Buffer.from([])
  }

  get output () {
    return this._data
  }

  _transform (chunk, _, callback) {
    this._data = Buffer.concat([this._data, chunk])
    callback(null, chunk)
  }
}

function run (command, args) {
  return new Promise((resolve, reject) => {
    const stdout = new RecordStream();
    const stderr = new RecordStream();
    // Execute the command
    const task = spawn(shell, [...args, command])

    // Record stream output and pass it through main process
    task.stdout.pipe(stdout).pipe(process.stdout);
    task.stderr.pipe(stderr).pipe(process.stderr);

    task.on('error', error => reject(error))
    task.on('close', code => {
      core.setOutput('stdout', stdout.output.toString());
      core.setOutput('stderr', stderr.output.toString());

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process completed with exit code ${code}.`));
      }
    })
  })
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    const command = core.getInput('run');
    if (!command) {
      throw new Error(`option "run" must be one provided.`);
    }

    const shell = core.getInput('shell');
    const args = options[shell];
    // check the arguments
    if (!args) {
      throw new Error(`option "shell" must be one of: ${options_keys}.`);
    }

    // execute the command
    await run(command, args);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
