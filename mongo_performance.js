const { spawn } = require('node:child_process');
process.env.path += ";C:\\mongodb\\bin";

let end_time, start_time, log = "";
const mongo = spawn('mongosh', [], {
    shell: true,
    detached: false
});

mongo.stdout.on("data", (chunk) => {
    log += (chunk.toString());
});

mongo.stdout.on("error", (err) => {
    log += (err.toString());
});

mongo.stdout.on("close", (code) => {
    log += (code);
    console.log(log);
    console.log(`El tiempo total fue: ${end_time - start_time} ms`);
});

mongo.on("error", (err) => {
    log += (err.toString());
});

mongo.stdin.on("finish", () => {
    end_time = Date.now();
});

mongo.stderr.on("data", (chunk) => {
    log += (chunk.toString());
});

mongo.stderr.on("error", (error) => {
    log += (error.toString());
});