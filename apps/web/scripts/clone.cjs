const { loadEnvConfig } = require("@next/env");
const git = require("isomorphic-git")
const http = require("isomorphic-git/http/node")
const fs = require("node:fs")
const path = require("node:path")

loadEnvConfig(process.cwd());

const token = process.env.GH_TOKEN;
const url = process.env.DATA_REPOSITORY;

function getContentPath() {
  return path.join(process.cwd(), '.content');
}

const auth = { username: "x-access-token", password: token };
const dest = getContentPath();

async function copyDemoContent() {
  const demoSource = path.join(process.cwd(), 'demo-content');
  console.log("DATA_REPOSITORY is not set. Using bundled Ever Works eSIM demo content.");
  await fs.promises.rm(dest, { recursive: true, force: true });
  await fs.promises.cp(demoSource, dest, { recursive: true });
}

async function syncRepository() {
  await fs.promises.mkdir(dest, { recursive: true });

  const gitDir = path.join(dest, '.git');
  if (fs.existsSync(gitDir)) {
    console.log("Content repo already present, pulling latest changes:", dest);

    const pullOptions = {
      fs,
      http,
      url,
      dir: dest,
      author: { name: "website" },
      singleBranch: true,
    };

    if (token) pullOptions.onAuth = () => auth;
    await git.pull(pullOptions);
    return;
  }

  console.log("Cloning content repository to", dest);

  const cloneOptions = {
    fs,
    http,
    url,
    dir: dest,
    singleBranch: true,
  };

  if (token) cloneOptions.onAuth = () => auth;
  await git.clone(cloneOptions);
}

async function main() {
  if (!url) {
    await copyDemoContent();
    return;
  }
  await syncRepository();
}

main().catch(err => {
  console.warn("Continuing build without content repository.", err);
  process.exit(0);
});
