#!/usr/bin/env node

const cli = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')
const yaml = require('yaml')
const path = require('path')

let appsConfig = yaml.parse(fs.readFileSync(path.join(__dirname, '../config/sample.yaml'), 'utf8'))

const iioFolderPath = path.join('/home', process.env.USER, '.iio')

if (!fs.existsSync(iioFolderPath)) {
  fs.mkdirSync(iioFolderPath)
} else {
  // Manage older version overwrite
  if (fs.statSync(iioFolderPath).isFile()) {
    fs.unlinkSync(iioFolderPath)
    fs.mkdirSync(iioFolderPath)
  }
  // end
}

const appsCfgPath = path.join(iioFolderPath, 'apps-config.yml')

if (fs.existsSync(appsCfgPath)) {
  appsConfig = yaml.parse(fs.readFileSync(appsCfgPath, 'utf8'))
} else {
  fs.writeFileSync(appsCfgPath, yaml.stringify(appsConfig), 'utf8')
}

let packageDef = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
let version = JSON.parse(packageDef).version

let config = {
  apps: appsConfig,
  destPath: '.',
  iioFolderPath: iioFolderPath
}

cli
  .version(version, '-v, --version')
  .usage('[options] <command>')
  .option('-p, --path <path>', 'set destination directory path. defaults to ./<name>')
  .option('-a, --author <author>', 'set author')
  .option('-l, --lang <language>', 'set programming language: py, js (default: js)')

let commands = fs.readdirSync(path.join(__dirname, 'commands'))

for (let c of commands) {
  require(path.join(__dirname, 'commands', c))(config)
}

if (!process.argv.slice(2).length) {
  cli.outputHelp(make_orange)
}

cli.parse(process.argv)

function make_orange(txt) {
  return chalk.rgb(255, 165, 0)(txt) //display the help text in red on the console
}
