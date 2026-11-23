import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(Number(port), '127.0.0.1', () => server.close(error => error ? reject(error) : resolve()))
  })
}

await Promise.all([process.env.ACCOUNTABLE_WEB_PORT, process.env.ACCOUNTABLE_API_PORT].map(checkPort))
const npm = process.env.npm_execpath
const child = npm
  ? spawn(process.execPath, [npm, 'run', 'dev'], { stdio: 'inherit' })
  : spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' })
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 0 : 1) })
process.on('SIGTERM', () => child.kill('SIGTERM'))
process.on('SIGINT', () => child.kill('SIGINT'))
