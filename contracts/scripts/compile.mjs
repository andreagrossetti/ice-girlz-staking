// Compiles the production contracts (verified sources from Sourcify, in ../sources)
// with the exact compiler version and settings used on Polygon mainnet.
//
// Staging-only change: IceyStaking and IceRaffle hardcode the mainnet FROST address
// in their constructor. For testnet we turn it into a constructor parameter.
// Nothing else in the sources is changed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcesDir = path.join(root, "sources");
const outDir = path.join(root, "out");

const MAINNET_FROST = "0xEd06Bb12A7BAeF7aa6572535bE7f205872B78531";

const PATCHES = {
  "contracts/ice-girlz-staking.sol": [
    [
      `constructor() Ownable(msg.sender) {\n        frost = IFrost(${MAINNET_FROST});`,
      `constructor(address frost_) Ownable(msg.sender) {\n        frost = IFrost(frost_);`,
    ],
  ],
  "contracts/ice-raffles.sol": [
    [
      `constructor(address owner) Ownable(owner){\n        frost = IFROST(${MAINNET_FROST});`,
      `constructor(address owner, address frost_) Ownable(owner){\n        frost = IFROST(frost_);`,
    ],
  ],
};

const TARGETS = ["frost", "iceGirlz", "iceFolks", "staking", "raffles"];

function readSource(p) {
  let content = fs.readFileSync(path.join(sourcesDir, p), "utf8");
  for (const [from, to] of PATCHES[p] ?? []) {
    if (!content.includes(from)) throw new Error(`Staging patch not applicable to ${p}`);
    content = content.replace(from, to);
  }
  return content;
}

const loadSolc = (version) =>
  new Promise((resolve, reject) =>
    solc.loadRemoteVersion(`v${version}`, (err, s) => (err ? reject(err) : resolve(s))),
  );

fs.mkdirSync(outDir, { recursive: true });
const compilers = {};

for (const name of TARGETS) {
  const meta = JSON.parse(fs.readFileSync(path.join(root, "verified", `${name}.json`), "utf8"));
  const [file, contractName] = meta.fullyQualifiedName.split(":");
  compilers[meta.compilerVersion] ??= await loadSolc(meta.compilerVersion);

  const input = {
    language: "Solidity",
    sources: { [file]: { content: readSource(file) } },
    settings: {
      optimizer: meta.settings.optimizer,
      evmVersion: meta.settings.evmVersion,
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const findImports = (p) => {
    try {
      return { contents: readSource(p) };
    } catch {
      return { error: `File not found: ${p}` };
    }
  };

  const output = JSON.parse(compilers[meta.compilerVersion].compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));

  const c = output.contracts[file][contractName];
  fs.writeFileSync(
    path.join(outDir, `${name}.json`),
    JSON.stringify({ contractName, compilerVersion: meta.compilerVersion, abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2),
  );
  console.log(`compiled ${name} (${contractName}, solc ${meta.compilerVersion}, ${meta.settings.evmVersion})`);
}
