'use strict';

var exec = require('child_process').exec;

function shell(cmd, args, cb) {

  // console.info('\n' + cmd + ' ' + args.join(' '));

  // Using exec not spawn since spawn will not start a .cmd
  // which is what azure CLI is on Windows

  var stdout = '';
  var stderr = '';
  var shell = exec(cmd + ' ' + args.join(' '));

  shell.stdout.on('data', (data) => {
    stdout += data;
  });

  shell.stderr.on('data', (data) => {
    stderr += data;
  });

  shell.on('close', (code) => {
    cb(code, stdout, stderr)
  });
}

module.exports = shell;
