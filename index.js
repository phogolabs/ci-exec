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

class RecordStream extends Transform {
  constructor () {
    super()
    this._data = Buffer.from([])
  }

  get output () {
    return this._data
  }

  parse() {
    const text = this.output.toString();

     try {
       return JSON.parse(text);
     }
     catch (e) {
       return text
     }
  }

  _transform (chunk, _, callback) {
    this._data = Buffer.concat([this._data, chunk])
    callback(null, chunk)
  }
}

function exec(shell, command, workspace) {
  return new Promise((resolve, reject) => {
    // prepare the streams
    const stdout = new RecordStream();
    const stderr = new RecordStream();
    // prepare the shell arguments
    const args = [...options[shell], command];
    // prepare the process options
    const opts = { env: process.env, cwd: workspace ?? process.cwd() };
    // spawn the process
    const task = spawn(shell, args, opts);

    // Record stream output and pass it through main process
    task.stdout.pipe(stdout).pipe(process.stdout);
    task.stderr.pipe(stderr).pipe(process.stderr);

    task.on('error', error => reject(error))
    task.on('close', code => {
      core.setOutput('stdout', stdout.parse());
      core.setOutput('stderr', stderr.parse());

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
    const workspace = core.getInput("working-directory");
    // execute the command
    await exec(shell, command, workspace);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
