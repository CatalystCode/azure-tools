'use strict';

var shell = require('../lib/shell');
var PromisePool = require('es6-promise-pool');

function logSummary(emptyGroups, nonemptyGroups) {

  console.log('\n\n============== SUMMARY =================');
  console.log('\n' + emptyGroups.length + 'empty resource groups');
  for (let group of emptyGroups) {
    console.log(group.name);
  }
}

function main(argv) {

  shell('azure', ['group', 'list', '--json'], (exitCode, stdout, stderr) => {

    var resourceGroups = JSON.parse(stdout);
    console.info('Found ' + resourceGroups.length + ' resource groups..');

    function listResources(resourceGroup) {
      return new Promise((resolve, reject) => {
        shell('azure', ['resource', 'list', resourceGroup.name, '--json'], 
          (exitCode, stdout, stderr) => {
            if (exitCode === 0) {
              resolve([resourceGroup, stdout]);
            }
            else {
              reject(stderr);
            }
          }
        );
      });
    }

    const groupIterator = function * () {
      for (let resourceGroup of resourceGroups) {
        yield(listResources(resourceGroup));
      }
    };

    let emptyGroups = [];
    let nonemptyGroups = {};

    // Using a promise pool here because unlimited concurrency
    // will make your machine unusuable for a while 
    const pool = new PromisePool(groupIterator, 8);

    pool.addEventListener('fulfilled', (ev) => {
      let resourceGroup = ev.data.result[0];
      let resources = ev.data.result[1];
      if (resources.length === 0) {
        console.info(resourceGroup.name + ' is empty');
        emptyGroups.push(resourceGroup);
      }
      else {
        console.info(resourceGroup.name + ' is not empty');
        nonemptyGroups[resourceGroup.name] = resources;
      }
    });

    pool.start()
    .then(() => { logSummary(emptyGroups, nonemptyGroups); })
    .catch((e) => { console.error(e.stack); });
  });
}

if (require.main === module) {
  main(process.argv);
}
